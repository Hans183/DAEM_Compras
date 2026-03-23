import pb from "./src/lib/pocketbase.js";

async function listSep() {
  try {
    const list = await pb.collection("requirente").getFullList({
      filter: "sep = true",
      sort: "nombre",
    });
    console.log(
      JSON.stringify(
        list.map((r) => r.nombre),
        null,
        2,
      ),
    );
  } catch (e) {
    console.error(e);
  }
}

listSep();
