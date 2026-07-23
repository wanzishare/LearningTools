/**
 * 英语单词默写 · 学生列表（扩展学生只改这里）
 *
 * 默认：满满 → words-mm.xls / words-mm.xlsx
 * 新增学生示例：
 *   { key: "bb", label: "贝贝", icon: "👦" }  → words-bb.xls
 *
 * 入口页按本列表自动出按钮；练习页用 ?grade=key 进入。
 */
(function (global) {
  "use strict";

  var STUDENTS = [
    { key: "mm", label: "满满", icon: "👧" },
    // { key: "bb", label: "贝贝", icon: "👦" },
  ];

  var FILE_PREFIX = "words";

  function getStudentFiles(st) {
    if (st && st.files && st.files.length) return st.files.slice();
    var key = st && st.key ? st.key : "";
    return [FILE_PREFIX + "-" + key + ".xls", FILE_PREFIX + "-" + key + ".xlsx"];
  }

  function getStudentByKey(key) {
    key = String(key || "").trim().toLowerCase();
    if (!key) return null;
    for (var i = 0; i < STUDENTS.length; i++) {
      if (STUDENTS[i].key === key) return STUDENTS[i];
    }
    return null;
  }

  function listStudents() {
    return STUDENTS.map(function (st) {
      return {
        key: st.key,
        label: st.label,
        icon: st.icon || "🙂",
        files: getStudentFiles(st),
      };
    });
  }

  /** 从 URL 解析当前学生；单学生时可省略参数 */
  function resolveFromUrl() {
    var params = new URLSearchParams(location.search);
    var key = (params.get("grade") || params.get("student") || "").trim().toLowerCase();
    if (key) {
      var hit = getStudentByKey(key);
      if (hit) return { student: hit, files: getStudentFiles(hit), missing: false };
      return { student: null, files: [], missing: true };
    }
    if (STUDENTS.length === 1) {
      return { student: STUDENTS[0], files: getStudentFiles(STUDENTS[0]), missing: false };
    }
    return { student: null, files: [], missing: true };
  }

  global.TOOL_STUDENTS = STUDENTS;
  global.StudentRoster = {
    FILE_PREFIX: FILE_PREFIX,
    list: listStudents,
    getByKey: getStudentByKey,
    getFiles: getStudentFiles,
    resolveFromUrl: resolveFromUrl,
  };
})(typeof window !== "undefined" ? window : this);
