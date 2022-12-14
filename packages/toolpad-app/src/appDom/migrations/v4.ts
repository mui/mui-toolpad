import invariant from 'invariant';
import * as appDom from '..';
import { mapValues } from '../../utils/collections';

function replaceTypographyAndLinkWithText(node: appDom.AppDomNode): appDom.AppDomNode {
  if (node.type === 'element' && node.attributes.component.value === 'Typography') {
    return {
      ...node,
      name: node.name.replace(/Typography|Link/gi, 'text'),
      attributes: {
        component: {
          ...node.attributes.component,
          value: 'Text',
        },
      },
    };
  }
  return node;
}

export default {
  up(dom: appDom.AppDom): appDom.AppDom {
    invariant(dom.version === 3, 'Can only migrate dom of version 3');
    return {
      ...dom,
      nodes: mapValues(dom.nodes, (node) => replaceTypographyAndLinkWithText(node)),
      version: 4,
    };
  },
};
