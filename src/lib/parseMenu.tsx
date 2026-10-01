/**
 * parseMenuItems — Admin layout.menu flat array to nested tree
 *
 * Admin Layout rules:
 *   Normal title  → top-level item (level 1)
 *   "_Title"      → child of the last top-level item (level 2)
 *   "__Title"     → child of the last level-2 item  (level 3)
 *
 * Example input (from admin layout.html):
 *   [ {title:"Home", url:"/"}, {title:"Clothing", url:"/c/clothing"},
 *     {title:"_Men", url:"/c/men"}, {title:"__Shirts", url:"/c/shirts"},
 *     {title:"_Women", url:"/c/women"} ]
 *
 * Output:
 *   [
 *     { title:"Home", url:"/", children:[] },
 *     { title:"Clothing", url:"/c/clothing", children:[
 *       { title:"Men", url:"/c/men", children:[
 *         { title:"Shirts", url:"/c/shirts", children:[] }
 *       ]},
 *       { title:"Women", url:"/c/women", children:[] }
 *     ]}
 *   ]
 */
export function parseMenuItems(rawMenu = []) {
  const tree = [];

  rawMenu.forEach((item) => {
    const title = (item.title || '').trim();
    const url   = item.url || '#';

    if (title.startsWith('__')) {
      // Level 3 — child of last level-2 item
      const lastL1 = tree[tree.length - 1];
      if (lastL1 && lastL1.children.length > 0) {
        const lastL2 = lastL1.children[lastL1.children.length - 1];
        lastL2.children.push({ title: title.slice(2).trim(), url, children: [] });
      }
    } else if (title.startsWith('_')) {
      // Level 2 — child of last top-level item
      const lastL1 = tree[tree.length - 1];
      if (lastL1) {
        lastL1.children.push({ title: title.slice(1).trim(), url, children: [] });
      }
    } else if (title) {
      // Level 1 — top-level parent
      tree.push({ title, url, children: [] });
    }
  });

  return tree;
}
