console.error(
  [
    "Local seed is not available yet.",
    "P01-02 will add the database. A later seed command must refuse any target that is not local and disposable.",
    "This command did not connect or write data.",
    "Next task: P01-02.",
  ].join("\n"),
);
process.exit(1);
