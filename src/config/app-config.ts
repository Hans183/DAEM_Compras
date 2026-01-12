import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Compras DAEM",
  version: packageJson.version,
  copyright: `© ${currentYear}, Compras DAEM. por Hans von Edelsberg`,
  meta: {
    title: "Compras DAEM - Dashboard",
    description:
      "Compras DAEM es una plataforma de compras para la empresa DAEM.",
  },
};
