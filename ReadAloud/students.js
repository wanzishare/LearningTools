/**
 * 句子朗读 · 学生列表（扩展学生只改这里）
 *
 * 默认：满满 → read_aloud_2A_all.xlsx
 * 录音目录：LearningData/ReadAloud/recordings/{key}/
 * 新增学生示例：
 *   { key: "bb", label: "贝贝", icon: "👦", files: ["read_aloud-bb.xlsx"] }
 */
(function (global) {
  "use strict";

  var STUDENTS = [
    {
      key: "mm",
      label: "满满",
      icon: "👧",
      files: ["read_aloud_2A_all.xlsx"],
    },
    // { key: "bb", label: "贝贝", icon: "👦", files: ["read_aloud-bb.xlsx"] },
  ];

  var FILE_PREFIX = "read_aloud";

  function getStudentFiles(st) {
    if (st && st.files && st.files.length) return st.files.slice();
    var key = st && st.key ? st.key : "";
    return [FILE_PREFIX + "-" + key + ".xlsx", FILE_PREFIX + "-" + key + ".xls"];
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
