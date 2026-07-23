/**
 * LearningData（Gitee）读写封装
 * 参考 ReadAloud/index.html 的 Gitee API 用法
 *
 * 使用前请确认 CONFIG.REPOSITORY / TOKEN 与你的 LearningData 仓库一致。
 */
(function (global) {
  "use strict";

  var CONFIG = {
    // Gitee 仓库，格式：用户名/仓库名（对应 LearningData）
    REPOSITORY: "bufan1990/LearningData",
    // Gitee Personal Access Token（需要 projects 权限）
    TOKEN: "f62b136877bc9f4a2491f1ef30286857",
    API_BASE: "https://gitee.com/api/v5",
    BRANCH: "master",
  };

  /** @type {Record<string, string>} path -> sha */
  var shaCache = {};

  function joinPath(dir, name) {
    var d = String(dir || "").replace(/^\/+|\/+$/g, "");
    var n = String(name || "").replace(/^\/+/, "");
    if (!d) return n;
    if (!n) return d;
    return d + "/" + n;
  }

  function apiContentsUrl(filePath, withRef) {
    var q = "access_token=" + encodeURIComponent(CONFIG.TOKEN);
    if (withRef !== false) {
      q += "&ref=" + encodeURIComponent(CONFIG.BRANCH);
    }
    return (
      CONFIG.API_BASE +
      "/repos/" +
      CONFIG.REPOSITORY +
      "/contents/" +
      String(filePath).replace(/^\/+/, "") +
      "?" +
      q
    );
  }

  function uint8ToBase64(u8) {
    var binary = "";
    var chunk = 0x8000;
    for (var i = 0; i < u8.length; i += chunk) {
      binary += String.fromCharCode.apply(
        null,
        u8.subarray(i, Math.min(i + chunk, u8.length))
      );
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function toUint8Array(data) {
    if (!data) return new Uint8Array(0);
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    if (Array.isArray(data)) return new Uint8Array(data);
    return new Uint8Array(data);
  }

  function isWorkbookName(name) {
    var base = String(name || "").split("/").pop() || "";
    if (!/\.(xls|xlsx)$/i.test(base)) return false;
    if (/^~\$/i.test(base)) return false;
    return true;
  }

  /**
   * 列出目录下的 xls/xlsx 文件名
   * @param {string} dirPath 如 EnglishChineseMatchingGame
   * @returns {Promise<string[]>}
   */
  async function listWorkbookFiles(dirPath) {
    var url = apiContentsUrl(dirPath);
    var res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
    });
    if (!res.ok) {
      throw new Error("Gitee 列出目录失败: " + res.status + " " + res.statusText);
    }
    var data = await res.json();
    if (!Array.isArray(data)) {
      // 可能是单文件
      if (data && data.type === "file" && isWorkbookName(data.name)) {
        if (data.sha) shaCache[data.path || joinPath(dirPath, data.name)] = data.sha;
        return [data.name];
      }
      return [];
    }
    var names = [];
    data.forEach(function (item) {
      if (item && item.type === "file" && isWorkbookName(item.name)) {
        names.push(item.name);
        if (item.sha) {
          shaCache[item.path || joinPath(dirPath, item.name)] = item.sha;
        }
      }
    });
    names.sort(function (a, b) {
      return a.localeCompare(b, "zh");
    });
    return names;
  }

  /**
   * 获取文件元信息（含 sha）
   * @returns {Promise<{sha:string,size:number,path:string,name:string}|null>}
   */
  async function getFileMeta(filePath) {
    try {
      var res = await fetch(apiContentsUrl(filePath), {
        method: "GET",
        headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      });
      if (!res.ok) return null;
      var data = await res.json();
      if (Array.isArray(data) || !data || data.type !== "file") return null;
      if (data.sha) shaCache[filePath] = data.sha;
      return {
        sha: data.sha,
        size: data.size,
        path: data.path || filePath,
        name: data.name,
        download_url: data.download_url,
      };
    } catch (e) {
      return null;
    }
  }

  async function getFileSHA(filePath) {
    if (shaCache[filePath]) return shaCache[filePath];
    var meta = await getFileMeta(filePath);
    return meta ? meta.sha : null;
  }

  /**
   * 从 Gitee 下载文件为 ArrayBuffer
   * @param {string} filePath 仓库内完整路径
   * @returns {Promise<ArrayBuffer>}
   */
  async function fetchFile(filePath) {
    var path = String(filePath).replace(/^\/+/, "");
    console.log("[GiteeData] 开始获取:", path);

    try {
      var res = await fetch(apiContentsUrl(path), {
        method: "GET",
        headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      });
      if (!res.ok) {
        throw new Error("Gitee API 错误: " + res.status + " " + res.statusText);
      }
      var fileData = await res.json();
      if (fileData.sha) shaCache[path] = fileData.sha;

      if (fileData.content && fileData.encoding === "base64") {
        var buf = base64ToArrayBuffer(fileData.content.replace(/\n/g, ""));
        console.log("[GiteeData] 下载成功(API content):", path, buf.byteLength);
        return buf;
      }

      // 大文件可能只有 download_url
      if (fileData.download_url) {
        var dl = await fetch(fileData.download_url, {
          method: "GET",
          headers: { Accept: "application/octet-stream", "Cache-Control": "no-cache" },
        });
        if (!dl.ok) throw new Error("download_url 失败: " + dl.status);
        var ab = await dl.arrayBuffer();
        console.log("[GiteeData] 下载成功(download_url):", path, ab.byteLength);
        return ab;
      }
      throw new Error("Gitee 返回无 content/download_url");
    } catch (err) {
      console.warn("[GiteeData] API 获取失败，尝试 raw 链接:", err);
      var rawUrl =
        "https://gitee.com/" +
        CONFIG.REPOSITORY +
        "/raw/" +
        CONFIG.BRANCH +
        "/" +
        path +
        "?t=" +
        Date.now();
      var rawRes = await fetch(rawUrl, {
        method: "GET",
        headers: { Accept: "application/octet-stream" },
      });
      if (!rawRes.ok) {
        throw new Error(
          "无法从 Gitee 获取文件 " + path + ": " + ((err && err.message) || err)
        );
      }
      var rawBuf = await rawRes.arrayBuffer();
      console.log("[GiteeData] 下载成功(raw):", path, rawBuf.byteLength);
      // raw 成功后尽量补齐 sha，便于后续保存
      getFileMeta(path).catch(function () {});
      return rawBuf;
    }
  }

  /**
   * 在业务目录下按候选文件名依次尝试加载
   * @param {string} dataDir
   * @param {string[]} candidates
   * @returns {Promise<{buffer:ArrayBuffer,filename:string}|null>}
   */
  async function fetchFirstWorkbook(dataDir, candidates) {
    var list = candidates && candidates.length ? candidates.slice() : null;
    if (!list) {
      try {
        list = await listWorkbookFiles(dataDir);
      } catch (_) {
        list = [];
      }
    }
    var lastErr = null;
    for (var i = 0; i < list.length; i++) {
      var name = list[i];
      try {
        var buffer = await fetchFile(joinPath(dataDir, name));
        if (buffer && buffer.byteLength >= 256) {
          return { buffer: buffer, filename: name };
        }
      } catch (e) {
        lastErr = e;
        console.warn("[GiteeData] 候选失败:", name, e);
      }
    }
    if (lastErr) console.warn("[GiteeData] 全部候选失败:", lastErr);
    return null;
  }

  /**
   * 创建或更新仓库文件
   * @param {string} filePath
   * @param {ArrayBuffer|Uint8Array|number[]} data
   * @param {string} [message]
   * @returns {Promise<{ok:boolean,file:string,sha?:string}>}
   */
  async function saveFile(filePath, data, message) {
    if (!CONFIG.REPOSITORY || !CONFIG.TOKEN) {
      throw new Error("请先配置 Gitee REPOSITORY 与 TOKEN");
    }
    var path = String(filePath).replace(/^\/+/, "");
    var u8 = toUint8Array(data);
    if (u8.length < 256) {
      throw new Error("文件过小或损坏，拒绝上传");
    }
    var content = uint8ToBase64(u8);
    var sha = shaCache[path] || (await getFileSHA(path));
    var body = {
      access_token: CONFIG.TOKEN,
      content: content,
      message: message || ("更新数据: " + path),
      branch: CONFIG.BRANCH,
      committer: {
        name: "LearningToolbox",
        email: "noreply@gitee.com",
      },
    };
    if (sha) body.sha = sha;

    var method = sha ? "PUT" : "POST";
    console.log("[GiteeData] 保存:", path, method, "size=", u8.length);

    var res = await fetch(
      CONFIG.API_BASE +
        "/repos/" +
        CONFIG.REPOSITORY +
        "/contents/" +
        path,
      {
        method: method,
        mode: "cors",
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        body: JSON.stringify(body),
      }
    );

    var text = await res.text();
    var result = {};
    try {
      if (text) result = JSON.parse(text);
    } catch (_) {}

    // 若 POST 因已存在失败，改用 PUT
    if (!res.ok && method === "POST" && /exists|已存在|422|409/i.test(text + res.status)) {
      var existSha = await getFileSHA(path);
      if (existSha) {
        body.sha = existSha;
        res = await fetch(
          CONFIG.API_BASE +
            "/repos/" +
            CONFIG.REPOSITORY +
            "/contents/" +
            path,
          {
            method: "PUT",
            mode: "cors",
            headers: { "Content-Type": "application/json;charset=UTF-8" },
            body: JSON.stringify(body),
          }
        );
        text = await res.text();
        try {
          if (text) result = JSON.parse(text);
        } catch (_) {}
      }
    }

    if (!res.ok) {
      throw new Error(
        "Gitee 保存失败 (" + res.status + "): " + (text || res.statusText).slice(0, 300)
      );
    }

    var newSha =
      (result.content && result.content.sha) ||
      (result.commit && result.commit.sha) ||
      null;
    if (newSha && result.content && result.content.sha) {
      shaCache[path] = result.content.sha;
    } else if (result.content && result.content.sha) {
      shaCache[path] = result.content.sha;
    } else {
      // 下次再查
      delete shaCache[path];
    }

    var basename = path.split("/").pop();
    return { ok: true, file: basename, sha: shaCache[path], queued: false };
  }

  /**
   * 兼容旧本地 API 的保存结果形状，便于少改业务代码
   */
  async function saveWorkbook(dataDir, filename, data, message) {
    var path = joinPath(dataDir, filename);
    var saved = await saveFile(
      path,
      data,
      message || ("保存词库/练习数据: " + path)
    );
    return {
      res: { ok: true, status: 200 },
      text: JSON.stringify(saved),
      data: saved,
    };
  }

  global.GiteeData = {
    CONFIG: CONFIG,
    joinPath: joinPath,
    listWorkbookFiles: listWorkbookFiles,
    getFileMeta: getFileMeta,
    getFileSHA: getFileSHA,
    fetchFile: fetchFile,
    fetchFirstWorkbook: fetchFirstWorkbook,
    saveFile: saveFile,
    saveWorkbook: saveWorkbook,
    isWorkbookName: isWorkbookName,
  };
})(typeof window !== "undefined" ? window : this);
