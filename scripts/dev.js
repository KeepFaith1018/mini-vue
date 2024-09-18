import minimist from "minimist";
import {resolve,dirname} from 'path';
import {fileURLToPath} from 'url';
import esbuild from 'esbuild';
import {createRequire} from 'module';
/**
 * 打包函数
 * 命令行参数为
 *  target 要打包的文件
 *  format 打包的形式
 */
const require = createRequire(import.meta.url);


// minimist 解析命令行参数
const args = minimist(process.argv.slice(2));
const target = args._[0] || "reactivity"
const format = args._[1] || "iife"

// 解析文件路径
const __filename = fileURLToPath(import.meta.url);
console.log("--filename",__filename);
const __dirname = dirname(__filename);
console.log("__dirname",__dirname);

// 打包的入口文件,根据命令行参数,约定每个模块都是src/index.ts
const entry = resolve(__dirname,`../packages/${target}/src/index.ts`);
const pgk = require(`../packages/${target}/package.json`);

// 根据需要进行打包
esbuild.context({
    entryPoints:[entry], // 打包的入口点
    outfile: resolve(__dirname,`../packages/${target}/dist/${target}.js`), // 打包的出口
    bundle: true, // reactivity依赖share,会打包到一起
    platform:"browser", // 打包后成果的运行环境 浏览器   node
    sourcemap: true,
    format, // cjs(require) esm(import) iife(立即执行函数),
    globalName:pgk.buildOptions?.name
}).then((ctx) =>{
    console.log(`${target}打包完成`)
    return ctx.watch();
})

