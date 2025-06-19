import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'katex/dist/katex.min.css';
import { useRef } from 'react';
import Draggable from 'react-draggable';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface InfoButtonBoxProps {
  infoButtonBox: any;
  setInfoButtonBox: any;
}

export function InfoButtonBox({ infoButtonBox, setInfoButtonBox }: InfoButtonBoxProps) {
  function handleClose() {
    setInfoButtonBox({});
  }
  const nodeRef = useRef<HTMLDivElement>(null) as any;
  return (
    <Draggable nodeRef={nodeRef} cancel=".clickable">
      <div
        className="w-[26rem] ml-4 left-full top-[5vh] absolute bg-[rgba(17,17,17,0.6)] text-white z-20 p-2 rounded-[16px] shadow-[0px_4px_4px_rgba(0,0,0,1)] whitespace-pre-line overflow-y-auto overflow-x-hidden"
        id="info-subsection"
        ref={nodeRef}
      >
        <div className="flex justify-end">
          <FontAwesomeIcon
            icon={faCircleXmark}
            onClick={handleClose}
            className="clickable cursor-pointer hover:text-yellow-500"
          />
        </div>
        <div className="markdown font-bold text-center pb-3 text-xl">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {infoButtonBox.title}
          </ReactMarkdown>
        </div>
        <div className="markdown-content content-center pb-2 pt-3 max-h-[85vh] overflow-y-auto overflow-x-hidden">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {infoButtonBox.content}
          </ReactMarkdown>
        </div>
      </div>
    </Draggable>
  );
}
