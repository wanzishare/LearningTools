/**
 * 听写 · 课表配置（扩展课目只改这里）
 *
 * - file：对应目录下的 html 文件名
 * - title：页面标题 / 主菜单显示名（如「英语-二下」「语文-二下」）
 * - icon / color / desc：主菜单展示用
 *
 * 例：加「英语-三上」
 *   { file: "yingyu-3A.html", title: "英语-三上", icon: "🔤", color: "#64b5f6" }
 *   并在同目录放好 yingyu-3A.html
 */
(function (global) {
  "use strict";

  var LESSONS = [
    {
      file: "yingyu-2B.html",
      title: "英语-二下",
      icon: "🔤",
      color: "#64b5f6",
      desc: "英语听写播报",
    },
    {
      file: "yuwen-2B.html",
      title: "语文-二下",
      icon: "📖",
      color: "#ff9a5c",
      desc: "语文听写播报",
    },
  ];

  function getCurrentFile() {
    var path = (location.pathname || "").replace(/\\/g, "/");
    var m = path.match(/([^/]+\.html?)$/i);
    return m ? m[1] : "";
  }

  function getByFile(file) {
    file = String(file || "").trim().toLowerCase();
    if (!file) return null;
    for (var i = 0; i < LESSONS.length; i++) {
      if (String(LESSONS[i].file || "").toLowerCase() === file) return LESSONS[i];
    }
    return null;
  }

  function listLessons() {
    return LESSONS.map(function (item) {
      return {
        file: item.file,
        title: item.title || item.file,
        icon: item.icon || "📝",
        color: item.color || "#3679e0",
        desc: item.desc || "",
      };
    });
  }

  /**
   * 按当前 html 文件名套用标题
   * 会改 document.title，以及 #pageTitle / 第一个 h2
   */
  function applyPageTitle() {
    var lesson = getByFile(getCurrentFile());
    if (!lesson) return null;
    var title = lesson.title || "";
    if (title) {
      document.title = title + " · 听写";
      var el =
        document.getElementById("pageTitle") ||
        document.querySelector(".container h2") ||
        document.querySelector("h2");
      if (el) el.textContent = title;
    }
    return lesson;
  }

  global.TINGXIE_LESSONS = LESSONS;
  global.TingXieLessons = {
    list: listLessons,
    getByFile: getByFile,
    getCurrent: function () {
      return getByFile(getCurrentFile());
    },
    applyPageTitle: applyPageTitle,
  };
})(typeof window !== "undefined" ? window : this);
