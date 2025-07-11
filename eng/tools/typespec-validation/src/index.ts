import { stat } from "node:fs/promises";
import { ParseArgsConfig, parseArgs } from "node:util";
import { Suppression } from "suppressions";
import { CompileRule } from "./rules/compile.js";
import { EmitAutorestRule } from "./rules/emit-autorest.js";
import { FlavorAzureRule } from "./rules/flavor-azure.js";
import { FolderStructureRule } from "./rules/folder-structure.js";
import { FormatRule } from "./rules/format.js";
import { LinterRulesetRule } from "./rules/linter-ruleset.js";
import { NpmPrefixRule } from "./rules/npm-prefix.js";
import { SdkTspConfigValidationRule } from "./rules/sdk-tspconfig-validation.js";
import { fileExists, getSuppressions, normalizePath } from "./utils.js";

// Context argument may add new properties or override checkingAllSpecs
export var context: Record<string, any> = { checkingAllSpecs: false };

export async function main() {
  const args = process.argv.slice(2);
  const options = {
    folder: {
      type: "string",
      short: "f",
    },
    context: {
      type: "string",
      short: "c",
    },
  };
  const parsedArgs = parseArgs({ args, options, allowPositionals: true } as ParseArgsConfig);
  const folder = parsedArgs.positionals[0];

  if (parsedArgs.positionals[1]) {
    context = { ...context, ...JSON.parse(parsedArgs.positionals[1]) };
  }

  const absolutePath = normalizePath(folder);

  if (!(await fileExists(absolutePath))) {
    console.log(`Folder ${absolutePath} does not exist`);
    process.exit(1);
  }
  if (!(await stat(absolutePath)).isDirectory()) {
    console.log(`Please run TypeSpec Validation on a directory path`);
    process.exit(1);
  }
  console.log("Running TypeSpecValidation on folder: ", absolutePath);

  const suppressions: Suppression[] = await getSuppressions(absolutePath);

  // Suppressions for the whole tool must have no rules or sub-rules
  const toolSuppressions = suppressions.filter((s) => !s.rules?.length && !s.subRules?.length);

  if (toolSuppressions && toolSuppressions[0]) {
    // Use reason from first matching suppression and ignore rest
    console.log(`  Suppressed: ${suppressions[0].reason}`);
    return;
  }

  const rules = [
    new FolderStructureRule(),
    new NpmPrefixRule(),
    new EmitAutorestRule(),
    new FlavorAzureRule(),
    new LinterRulesetRule(),
    new CompileRule(),
    new FormatRule(),
    new SdkTspConfigValidationRule(),
  ];
  let success = true;
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    console.log("\nExecuting rule: " + rule.name);
    const result = await rule.execute(absolutePath);
    if (result.stdOutput) console.log(result.stdOutput);
    if (!result.success) {
      success = false;
      console.log("Rule " + rule.name + " failed");
      if (result.errorOutput) console.log(result.errorOutput);

      // Stop executing more rules, since the results are more likely to be confusing than helpful
      // Can add property like "RuleResult.ContinueOnError" if some rules want to continue
      break;
    }
  }

  if (!success) {
    process.exitCode = 1;
  }
}
