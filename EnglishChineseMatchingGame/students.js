/**
 * 对对碰 · 学生列表（扩展学生只改这里）
 *
 * 约定：
 * - key：短英文标识，用于 URL ?grade=key，以及词库文件名 words-{key}.xls
 * - 新增学生：往数组里加一项，并在 Gitee LearningData/EnglishChineseMatchingGame/ 上传对应词库
 * - 不需要再复制 play-xx.html
 *
 * 例：加「小明」
 *   { key: "xm", label: "小明", icon: "🧒", color: "#7eb8ff", bg: "#eef6ff" }
 *   并上传 words-xm.xls（或 .xlsx）
 */
(function (global) {
  "use strict";

  var STUDENTS = [
    { key: "mm", label: "满满", icon: "👧", color: "#ff9a5c", bg: "#fff9e6" },
    { key: "bb", label: "贝贝", icon: "👦", color: "#3ecda0", bg: "#ecfff6" },
  ];

  var FILE_PREFIX = "words";

  function getStudentFiles(st) {
    if (st && st.files && st.files.length) return st.files.slice();
    var key = st && st.key ? st.key : "";
    return [FILE_PREFIX + "-" + key + ".xls", FILE_PREFIX + "-" + key + ".xlsx"];
  }

  function getStudentByKey(key) {
    key = String(key || "")
      .trim()
      .toLowerCase();
    if (!key) return null;
    for (var i = 0; i < STUDENTS.length; i++) {
      if (STUDENTS[i].key === key) return STUDENTS[i];
    }
    return null;
  }

  /** 兼容旧 WORDS_PRESETS 形状：{ mm: { label, files }, ... } */
  function buildWordsPresets() {
    var o = {};
    STUDENTS.forEach(function (st) {
      o[st.key] = { label: st.label, files: getStudentFiles(st) };
    });
    return o;
  }

  /** 家长端 / 入口用的完整列表 */
  function listStudents() {
    return STUDENTS.map(function (st) {
      return {
        key: st.key,
        label: st.label,
        icon: st.icon || "🙂",
        color: st.color || "#a78bfa",
        bg: st.bg || "#f5f0ff",
        files: getStudentFiles(st),
      };
    });
  }

  function studentKeysPattern() {
    return STUDENTS.map(function (s) {
      return s.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join("|");
  }

  global.TOOL_STUDENTS = STUDENTS;
  global.StudentRoster = {
    FILE_PREFIX: FILE_PREFIX,
    list: listStudents,
    getByKey: getStudentByKey,
    getFiles: getStudentFiles,
    buildPresets: buildWordsPresets,
    keysPattern: studentKeysPattern,
  };
})(typeof window !== "undefined" ? window : this);
