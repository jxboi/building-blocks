import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

function isProductFile(context) {
  const filename = context.filename.replaceAll("\\", "/");
  return filename.includes("/src/") && !filename.includes("/src/components/ui/");
}

const designSystemRules = {
  "no-raw-interactive-elements": {
    meta: { type: "problem", messages: { raw: "Use the shared {{name}} primitive instead of a raw <{{name}> element." } },
    create(context) {
      return {
        JSXOpeningElement(node) {
          if (!isProductFile(context) || node.name.type !== "JSXIdentifier") return;
          if (["button", "input", "select", "textarea"].includes(node.name.name)) {
            context.report({ node, messageId: "raw", data: { name: node.name.name } });
          }
        },
      };
    },
  },
  "no-raw-img": {
    meta: { type: "problem", messages: { raw: "Use the shared <Img> wrapper so dimensions and private variants are enforced." } },
    create(context) {
      return {
        JSXOpeningElement(node) {
          if (!isProductFile(context) || node.name.type !== "JSXIdentifier") return;
          if (node.name.name === "img") context.report({ node, messageId: "raw" });
        },
      };
    },
  },
  "no-off-scale-values": {
    meta: { type: "problem", messages: { arbitrary: "Use a documented spacing, radius, or type token instead of an arbitrary value." } },
    create(context) {
      return {
        Literal(node) {
          if (!isProductFile(context) || typeof node.value !== "string") return;
          if (/\[[^\]]*(?:px|rem|em|#[0-9a-f]{3,8})[^\]]*\]/i.test(node.value)) {
            context.report({ node, messageId: "arbitrary" });
          }
        },
      };
    },
  },
  "no-off-scale-typography": {
    meta: { type: "problem", messages: { size: "Use a token from the closed type scale (text-xs, text-sm, text-base, text-xl, text-2xl)." } },
    create(context) {
      return {
        Literal(node) {
          if (!isProductFile(context) || typeof node.value !== "string") return;
          // Bans font sizes outside the five-step scale; text-xl and text-2xl remain allowed.
          if (/\btext-(lg|[3-9]xl)\b/.test(node.value)) context.report({ node, messageId: "size" });
        },
      };
    },
  },
  "no-mixed-icon-libraries": {
    meta: { type: "problem", messages: { mixed: "Use lucide-react or a registered product icon." } },
    create(context) {
      return {
        ImportDeclaration(node) {
          if (!isProductFile(context)) return;
          const source = String(node.source.value);
          if (/react-icons|heroicons|phosphor|iconify/.test(source)) {
            context.report({ node, messageId: "mixed" });
          }
        },
      };
    },
  },
  "no-raw-toast": {
    meta: { type: "problem", messages: { raw: "Import the notify helper from @/lib/notify instead of calling sonner directly." } },
    create(context) {
      return {
        ImportDeclaration(node) {
          if (!isProductFile(context)) return;
          const filename = context.filename.replaceAll("\\", "/");
          if (filename.endsWith("/lib/notify.ts")) return;
          if (String(node.source.value) === "sonner") context.report({ node, messageId: "raw" });
        },
      };
    },
  },
  "no-hex-colors": {
    meta: { type: "problem", messages: { raw: "Use a semantic colour token instead of a hexadecimal colour." } },
    create(context) {
      return {
        Literal(node) {
          if (!isProductFile(context) || typeof node.value !== "string") return;
          if (/#[0-9a-f]{3,8}\b/i.test(node.value)) context.report({ node, messageId: "raw" });
        },
      };
    },
  },
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "building-blocks": { rules: designSystemRules } },
    rules: {
      "building-blocks/no-raw-interactive-elements": "error",
      "building-blocks/no-raw-img": "error",
      "building-blocks/no-off-scale-values": "error",
      "building-blocks/no-off-scale-typography": "error",
      "building-blocks/no-mixed-icon-libraries": "error",
      "building-blocks/no-raw-toast": "error",
      "building-blocks/no-hex-colors": "error",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "playwright-report/**", "test-results/**", "next-env.d.ts", "src/lib/api/schema.d.ts"]),
]);
