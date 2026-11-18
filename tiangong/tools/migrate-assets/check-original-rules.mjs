import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const require=createRequire(new URL('../../package.json',import.meta.url)),ts=require('typescript');
const sourcePath=resolve('../.tools/pr31-32-integration/rules.test.js'),text=readFileSync(sourcePath,'utf8'),file=ts.createSourceFile(sourcePath,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const ruleImport=file.statements.find(node=>ts.isImportDeclaration(node)&&node.moduleSpecifier.text==='./rules.js').getText(file).replace("'./rules.js'","'../../../assets/game/rules.js'");
const tests=[],skipped=[];for(const statement of file.statements){if(!ts.isExpressionStatement(statement)||!ts.isCallExpression(statement.expression)||statement.expression.expression.getText(file)!=='test')continue;const body=statement.getText(file);if(/\bT\.|\b(createBoss|hitBoss|canBossBombTarget|createSyringe)\s*\(/.test(body)){skipped.push(statement.expression.arguments[0]?.text);continue;}tests.push(body);}
mkdirSync('tools/migrate-assets/tests',{recursive:true});const target='tools/migrate-assets/tests/original-rules.test.mjs';writeFileSync(target,"import test from 'node:test';\nimport assert from 'node:assert/strict';\n"+ruleImport+'\n'+tests.join('\n'));
console.log(JSON.stringify({pureOriginalTests:tests.length,excludedThreeRenderingTests:skipped}));const result=spawnSync(process.execPath,['--test',target],{stdio:'inherit'});process.exitCode=result.status??1;
