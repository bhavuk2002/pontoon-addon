import React, { useMemo } from 'react';
import type { Renderer } from 'marked';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { DOMNode } from 'html-react-parser';
import parse, { domToReact, Element } from 'html-react-parser';

import { NativeLink } from '@frontend/commons/components/pontoon/NativeLink';

function renderMarkdown(markdown: string) {
  const renderer = new marked.Renderer();
  const defaultLinkRenderer = renderer.link;
  renderer.link = function (
    this: Renderer<never>,
    href: string | null,
    title: string | null,
    text: string,
  ): string {
    return defaultLinkRenderer
      .call(this, href, title, text)
      .replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
  };
  const html = marked(markdown, { renderer });
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
}

function wrapLinks(domNode: DOMNode): JSX.Element | void {
  if (
    domNode instanceof Element &&
    domNode.name === 'a' &&
    domNode.attribs?.href
  ) {
    return (
      <NativeLink
        href={domNode.attribs.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {domToReact(domNode.children)}
      </NativeLink>
    );
  }
}

interface Props extends React.ComponentProps<'div'> {
  markdownText: string;
}

export const MarkdownContent: React.FC<Props> = ({
  markdownText,
  ...props
}) => {
  const htmlToRender = useMemo(
    () => renderMarkdown(markdownText),
    [markdownText],
  );

  return <div {...props}>{parse(htmlToRender, { replace: wrapLinks })}</div>;
};
