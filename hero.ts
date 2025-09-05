// hero.ts
import { heroui } from "@heroui/theme";

export default heroui({
  defaultTheme: "light",
  themes: {
    light: {
      colors: {
        background: "#ffffff",
        foreground: "#272727",
        primary: { DEFAULT: "#265476", foreground: "#ffffff" },
        secondary: { DEFAULT: "#06AEEF", foreground: "#000000" },
        warning: { DEFAULT: "#F7D31A", foreground: "#272727" },
      },
    },
  },
});
