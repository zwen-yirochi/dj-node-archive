// scripts/analyze-dashboard.ts
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

interface ComponentAnalysis {
    name: string;
    path: string;
    type: 'server' | 'client';
    reasons: string[];
    size: number;
    imports: string[];
}

function analyzeComponent(filePath: string): ComponentAnalysis | null {
    if (!filePath.match(/\.(tsx|ts)$/)) return null;

    const content = readFileSync(filePath, 'utf-8');
    const name =
        filePath
            .split('/')
            .pop()
            ?.replace(/\.(tsx|ts)$/, '') || '';

    const isClient = content.includes("'use client'") || content.includes('"use client"');
    const reasons: string[] = [];

    // 클라이언트 컴포넌트 이유 분석
    if (content.includes('useState')) reasons.push('useState');
    if (content.includes('useEffect')) reasons.push('useEffect');
    if (content.includes('useRef')) reasons.push('useRef');
    if (content.includes('onClick') || content.includes('onChange')) reasons.push('event handlers');
    if (content.includes('onDrag') || content.includes('onDrop')) reasons.push('drag & drop');
    if (content.includes('createContext') || content.includes('useContext'))
        reasons.push('Context');
    if (content.includes('use client') && reasons.length === 0) reasons.push('explicit directive');

    // 외부 라이브러리 import
    const imports: string[] = [];
    const importMatches = content.matchAll(/import .+ from ['"](.+?)['"]/g);
    for (const match of importMatches) {
        const pkg = match[1];
        if (!pkg.startsWith('.') && !pkg.startsWith('@/')) {
            imports.push(pkg);
        }
    }

    return {
        name,
        path: filePath.replace(process.cwd() + '/', ''),
        type: isClient ? 'client' : 'server',
        reasons,
        size: content.length,
        imports,
    };
}

function walkDirectory(dir: string, results: ComponentAnalysis[] = []): ComponentAnalysis[] {
    const files = readdirSync(dir);

    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
            walkDirectory(filePath, results);
        } else {
            const analysis = analyzeComponent(filePath);
            if (analysis) results.push(analysis);
        }
    }

    return results;
}

// 실행
const dashboardPath = join(process.cwd(), 'src/app/dashboard');
const components = walkDirectory(dashboardPath);

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║         📊 Dashboard Component Analysis                  ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

const serverComps = components.filter((c) => c.type === 'server');
const clientComps = components.filter((c) => c.type === 'client');

console.log(`📈 Summary:`);
console.log(`   Total: ${components.length} components`);
console.log(
    `   Server: ${serverComps.length} (${Math.round((serverComps.length / components.length) * 100)}%)`
);
console.log(
    `   Client: ${clientComps.length} (${Math.round((clientComps.length / components.length) * 100)}%)\n`
);

console.log('─────────────────────────────────────────────────────────────\n');

console.log('🟢 SERVER COMPONENTS:\n');
if (serverComps.length === 0) {
    console.log('   (none)\n');
} else {
    serverComps.forEach((c) => {
        console.log(`   ✓ ${c.name}`);
        console.log(`     📁 ${c.path}`);
        console.log(`     📏 ${(c.size / 1024).toFixed(1)} KB\n`);
    });
}

console.log('─────────────────────────────────────────────────────────────\n');

console.log('🔵 CLIENT COMPONENTS:\n');
clientComps.forEach((c) => {
    console.log(`   ⚛️  ${c.name}`);
    console.log(`     📁 ${c.path}`);
    console.log(`     📏 ${(c.size / 1024).toFixed(1)} KB`);
    if (c.reasons.length) {
        console.log(`     🔍 Why: ${c.reasons.join(', ')}`);
    }
    if (c.imports.length) {
        console.log(
            `     📦 Deps: ${c.imports.slice(0, 3).join(', ')}${c.imports.length > 3 ? '...' : ''}`
        );
    }
    console.log();
});

console.log('─────────────────────────────────────────────────────────────\n');

// 최적화 제안
console.log('💡 OPTIMIZATION SUGGESTIONS:\n');

const largeClients = clientComps.filter((c) => c.size > 10000);
if (largeClients.length) {
    console.log(`   ⚠️  Large client components (>10KB):`);
    largeClients.forEach((c) => {
        console.log(`      - ${c.name} (${(c.size / 1024).toFixed(1)} KB)`);
    });
    console.log(`      → Consider code splitting\n`);
}

const unnecessaryClients = clientComps.filter(
    (c) => c.reasons.length === 1 && c.reasons[0] === 'explicit directive'
);
if (unnecessaryClients.length) {
    console.log(`   ⚠️  Components with 'use client' but no client features:`);
    unnecessaryClients.forEach((c) => {
        console.log(`      - ${c.name}`);
    });
    console.log(`      → Can be converted to server components\n`);
}

const totalClientSize = clientComps.reduce((sum, c) => sum + c.size, 0);
const totalServerSize = serverComps.reduce((sum, c) => sum + c.size, 0);

console.log(`   📊 Total code size:`);
console.log(`      Server: ${(totalServerSize / 1024).toFixed(1)} KB`);
console.log(`      Client: ${(totalClientSize / 1024).toFixed(1)} KB (sent to browser)`);
console.log(
    `      Ratio: ${Math.round((totalServerSize / (totalServerSize + totalClientSize)) * 100)}% server / ${Math.round((totalClientSize / (totalServerSize + totalClientSize)) * 100)}% client\n`
);

console.log('╚═══════════════════════════════════════════════════════════╝\n');
