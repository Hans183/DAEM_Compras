import PocketBase from "pocketbase";

const pb = new PocketBase("https://compras.daemlu.cl");

async function verify() {
  try {
    const list = await pb.collection("ingresos_mensuales_sep").getFullList({
      filter: "anio = 2026",
    });
    console.log(`Found ${list.length} records for 2026`);
    if (list.length > 0) {
      console.log("First record requirente ID:", list[0].requirente);
      console.log("First record total_reflejar:", list[0].total_reflejar);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

verify();
