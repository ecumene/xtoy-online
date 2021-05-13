// See https://github.com/leaningtech/cheerpj-meta/wiki/File-System-support

const asyncResolve = async (transaction) =>
  new Promise((resolve, reject) => {
    transaction.onsuccess = ({ target: { result } }) => resolve(result);
    transaction.onerror = reject;
  });

const getFileNames = async () =>
  asyncResolve(
    cheerpjFSMounts
      .find(({ mountPoint }) => mountPoint === "/files/")
      .dbConnection.transaction("files", "readwrite")
      .objectStore("files")
      .getAllKeys()
  );

const getAll = async (keys) =>
  Promise.all(
    keys.map(async (key) => [
      key,
      await asyncResolve(
        cheerpjFSMounts
          .find(({ mountPoint }) => mountPoint === "/files/")
          .dbConnection.transaction("files", "readwrite")
          .objectStore("files")
          .get(key)
      ),
    ])
  );

document.getElementById("download").addEventListener("mousedown", async () => {
  const files = await getFileNames();
  const toys = files.filter((str) => str.includes(".toy"));
  const loadedFiles = await getAll(toys);
  const decoder = new TextDecoder();
  const zip = new JSZip();
  console.log(loadedFiles);
  loadedFiles.forEach(([name, { contents }]) =>
    zip.file(name, decoder.decode(contents))
  );
  zip
    .generateAsync({ type: "blob" })
    .then((content) => saveAs(content, "xtoy.zip"));
});
