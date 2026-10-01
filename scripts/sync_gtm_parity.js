const fs = require('fs');

function transformGTM(filePath) {
  const j = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const version = j.containerVersion;
  
  // 1. Ensure CJS - FB Content IDs returns String array
  let varContentIds = version.variable.find(v => v.name === 'CJS - FB Content IDs');
  const contentIdsCode = `function() {
  var items = {{DLV - ecommerce.items}};
  if (!items || !Array.isArray(items) || items.length === 0) {
    return [];
  }
  return items.map(function(item) {
    return String(item.item_id || item.sku || item.id || '');
  });
}`;
  if (varContentIds) {
    const jsParam = varContentIds.parameter.find(p => p.key === 'javascript');
    if (jsParam) jsParam.value = contentIdsCode;
  }
  
  // 2. Ensure CJS - FB Contents variable
  let varContents = version.variable.find(v => v.name === 'CJS - FB Contents');
  const contentsCode = `function() {
  var items = {{DLV - ecommerce.items}};
  if (!items || !Array.isArray(items) || items.length === 0) {
    return [];
  }
  return items.map(function(item) {
    return {
      id: String(item.item_id || item.sku || item.id || ''),
      quantity: Number(item.quantity || 1),
      item_price: Number(item.price || item.item_price || item.base_price || 0)
    };
  });
}`;
  if (!varContents) {
    varContents = {
      accountId: version.accountId,
      containerId: version.containerId,
      variableId: '850',
      name: 'CJS - FB Contents',
      type: 'jsm',
      parameter: [
        { type: 'TEMPLATE', key: 'javascript', value: contentsCode }
      ],
      fingerprint: String(Date.now()),
      formatValue: {}
    };
    version.variable.push(varContents);
  } else {
    const jsParam = varContents.parameter.find(p => p.key === 'javascript');
    if (jsParam) jsParam.value = contentsCode;
  }

  // 3. Ensure CJS - FB Num Items variable
  let varNumItems = version.variable.find(v => v.name === 'CJS - FB Num Items');
  const numItemsCode = `function() {
  var items = {{DLV - ecommerce.items}};
  if (!items || !Array.isArray(items) || items.length === 0) {
    return 1;
  }
  return items.reduce(function(sum, item) {
    return sum + Number(item.quantity || 1);
  }, 0);
}`;
  if (!varNumItems) {
    varNumItems = {
      accountId: version.accountId,
      containerId: version.containerId,
      variableId: '851',
      name: 'CJS - FB Num Items',
      type: 'jsm',
      parameter: [
        { type: 'TEMPLATE', key: 'javascript', value: numItemsCode }
      ],
      fingerprint: String(Date.now()),
      formatValue: {}
    };
    version.variable.push(varNumItems);
  } else {
    const jsParam = varNumItems.parameter.find(p => p.key === 'javascript');
    if (jsParam) jsParam.value = numItemsCode;
  }

  // Helper to build objectPropertyList
  function setTagObjectProperties(tag, propMap) {
    let objListParam = tag.parameter.find(p => p.key === 'objectPropertyList');
    if (!objListParam) {
      objListParam = { type: 'LIST', key: 'objectPropertyList', list: [] };
      tag.parameter.push(objListParam);
    }
    objListParam.list = Object.entries(propMap).map(([k, v]) => ({
      type: 'MAP',
      map: [
        { type: 'TEMPLATE', key: 'name', value: k },
        { type: 'TEMPLATE', key: 'value', value: v }
      ]
    }));
  }

  // 4. Update FB Tags with 100% 1:1 Standard Parity
  version.tag.forEach(t => {
    if (t.name.includes('1. FB PageView')) {
      let objListParam = t.parameter.find(p => p.key === 'objectPropertyList');
      if (objListParam) objListParam.list = [];
    } else if (t.name.includes('2. FB ViewContent')) {
      setTagObjectProperties(t, {
        value: '{{DLV - ecommerce.value}}',
        currency: '{{DLV - ecommerce.currency}}',
        content_name: '{{DLV - ecommerce.items.0.item_name}}',
        content_category: '{{DLV - ecommerce.items.0.item_category}}',
        content_type: 'product',
        content_ids: '{{CJS - FB Content IDs}}',
        contents: '{{CJS - FB Contents}}',
        num_items: '{{CJS - FB Num Items}}'
      });
    } else if (t.name.includes('3. FB AddToCart')) {
      setTagObjectProperties(t, {
        value: '{{DLV - ecommerce.value}}',
        currency: '{{DLV - ecommerce.currency}}',
        content_name: '{{DLV - ecommerce.items.0.item_name}}',
        content_category: '{{DLV - ecommerce.items.0.item_category}}',
        content_type: 'product',
        content_ids: '{{CJS - FB Content IDs}}',
        contents: '{{CJS - FB Contents}}',
        num_items: '{{CJS - FB Num Items}}'
      });
    } else if (t.name.includes('7. FB AddToWishlist')) {
      setTagObjectProperties(t, {
        value: '{{DLV - ecommerce.value}}',
        currency: '{{DLV - ecommerce.currency}}',
        content_name: '{{DLV - ecommerce.items.0.item_name}}',
        content_category: '{{DLV - ecommerce.items.0.item_category}}',
        content_type: 'product',
        content_ids: '{{CJS - FB Content IDs}}',
        contents: '{{CJS - FB Contents}}',
        num_items: '{{CJS - FB Num Items}}'
      });
    } else if (t.name.includes('4. FB InitiateCheckout')) {
      setTagObjectProperties(t, {
        value: '{{DLV - ecommerce.value}}',
        currency: '{{DLV - ecommerce.currency}}',
        content_name: '{{DLV - ecommerce.items.0.item_name}}',
        content_category: '{{DLV - ecommerce.items.0.item_category}}',
        content_type: 'product',
        content_ids: '{{CJS - FB Content IDs}}',
        contents: '{{CJS - FB Contents}}',
        num_items: '{{CJS - FB Num Items}}',
        subtotal: '{{DLV - ecommerce.subtotal}}',
        coupon: '{{DLV - ecommerce.coupon}}',
        discount: '{{DLV - ecommerce.discount}}'
      });
    } else if (t.name.includes('9. FB AddPaymentInfo')) {
      setTagObjectProperties(t, {
        value: '{{DLV - ecommerce.value}}',
        currency: '{{DLV - ecommerce.currency}}',
        content_type: 'product',
        content_ids: '{{CJS - FB Content IDs}}',
        contents: '{{CJS - FB Contents}}',
        num_items: '{{CJS - FB Num Items}}',
        payment_method: '{{DLV - payment_method}}'
      });
    } else if (t.name.includes('5. FB Purchase')) {
      setTagObjectProperties(t, {
        value: '{{DLV - ecommerce.value}}',
        currency: '{{DLV - ecommerce.currency}}',
        content_name: '{{DLV - ecommerce.items.0.item_name}}',
        content_category: '{{DLV - ecommerce.items.0.item_category}}',
        content_type: 'product',
        content_ids: '{{CJS - FB Content IDs}}',
        contents: '{{CJS - FB Contents}}',
        num_items: '{{CJS - FB Num Items}}',
        order_id: '{{DLV - ecommerce.transaction_id}}',
        shipping_cost: '{{DLV - ecommerce.shipping}}',
        subtotal: '{{DLV - ecommerce.subtotal}}',
        payment_method: '{{DLV - payment_method}}',
        delivery_area: '{{DLV - delivery_area}}',
        coupon: '{{DLV - ecommerce.coupon}}',
        discount: '{{DLV - ecommerce.discount}}',
        status: '{{DLV - order_status}}'
      });
    } else if (t.name.includes('8. FB Search')) {
      setTagObjectProperties(t, {
        search_string: '{{DLV - search_term}}',
        content_type: 'product',
        content_ids: '{{CJS - FB Content IDs}}',
        num_items: '{{DLV - result_count}}'
      });
    } else if (t.name.includes('6. FB Contact (WhatsApp)')) {
      setTagObjectProperties(t, {
        content_name: 'WhatsApp Contact',
        content_category: 'Contact',
        contact_method: '{{DLV - contact_method}}'
      });
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(j, null, 2), 'utf8');
  console.log('Successfully transformed GTM parity in:', filePath);
}

transformGTM('gtm-setup/containers/gtm_web_container.json');
transformGTM('gtm-setup/containers/GTM-T3WL987S_workspace42.json');
