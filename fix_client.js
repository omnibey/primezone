const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src/app');

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // If the file contains use client but export const runtime = 'edge' is before it
    if (content.includes('use client') && content.includes("export const runtime = 'edge';")) {
        const useClientIndex = Math.min(
            content.indexOf("'use client'") !== -1 ? content.indexOf("'use client'") : Infinity,
            content.indexOf('"use client"') !== -1 ? content.indexOf('"use client"') : Infinity
        );
        const edgeIndex = content.indexOf("export const runtime = 'edge';");
        
        if (edgeIndex < useClientIndex) {
            // Fix it!
            // 1. Remove edge export
            content = content.replace(/export const runtime = 'edge';[\r\n]*/g, '');
            
            // 2. Put it right after use client
            content = content.replace(/('use client'|"use client");?[\r\n]*/, match => {
                return match + "export const runtime = 'edge';\n";
            });
            
            fs.writeFileSync(f, content);
            console.log('Fixed:', f);
        }
    }
});
