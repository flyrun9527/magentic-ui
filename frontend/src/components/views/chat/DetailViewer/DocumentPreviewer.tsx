  import React, { useState, useEffect, useRef, useMemo } from 'react';
  import { Drawer, Button, Skeleton } from 'antd';
  import { X } from 'lucide-react';
  import { 
    PdfLoader, 
    PdfHighlighter, 
    Highlight, 
    Popup, 
    AreaHighlight,
    IHighlight,
  } from 'react-pdf-highlighter';
  // import "react-pdf-highlighter/dist/style.css";
  import { v4 as uuid } from 'uuid';
  import { get } from 'lodash';
  import { IChunk, IReferenceChunk } from './PdfDrawer';


  interface IProps {
    chunk: IChunk | IReferenceChunk;
    pdfUrl: string;
    visible: boolean;
  }
  const buildChunkHighlights = (
    selectedChunk: IChunk | IReferenceChunk,
    size: { width: number; height: number },
  ) => {
    // 添加安全检查
    if (!selectedChunk || !selectedChunk.positions || !Array.isArray(selectedChunk.positions)) {
      console.warn('Invalid chunk data:', selectedChunk);
      return [];
    }

    return Array.isArray(selectedChunk?.positions) &&
      selectedChunk.positions.every((x) => Array.isArray(x))
      ? selectedChunk?.positions?.map((x) => {
          const boundingRect = {
            width: size.width,
            height: size.height,
            x1: x[1],
            x2: x[2],
            y1: x[3],
            y2: x[4],
          };
          return {
            id: uuid(),
            comment: {
              text: '',
              emoji: '',
            },
            content: {
              text:
                get(selectedChunk, 'content_with_weight') ||
                get(selectedChunk, 'content', ''),
            },
            position: {
              boundingRect: boundingRect,
              rects: [boundingRect],
              pageNumber: x[0],
            },
          };
        })
      : [];
  };
  const useGetChunkHighlights = (
    selectedChunk: IChunk | IReferenceChunk,
  ) => {
    const [size, setSize] = useState({ width: 849, height: 1200 });
  
    const highlights: IHighlight[] = useMemo(() => {
      return buildChunkHighlights(selectedChunk, size);
    }, [selectedChunk, size]);
  
    const setWidthAndHeight = (width: number, height: number) => {
      setSize((pre) => {
        if (pre.height !== height || pre.width !== width) {
          return { height, width };
        }
        return pre;
      });
    };
  
    return { highlights, setWidthAndHeight };
  };
  const HighlightPopup = ({
    comment,
  }: {
    comment: { text: string; emoji: string };
  }) =>
    comment.text ? (
      <div className="Highlight__popup">
        {comment.emoji} {comment.text}
      </div>
    ) : null;
  
  const DocumentPreviewer = ({ chunk, pdfUrl, visible }: IProps) => {
    const { highlights: state, setWidthAndHeight } = useGetChunkHighlights(chunk);
    const ref = useRef<(highlight: IHighlight) => void>(() => {});
    const [loaded, setLoaded] = useState(false);
    const [pdfReady, setPdfReady] = useState(false);
    const url = pdfUrl;
  
    const resetHash = () => {};
  
    useEffect(() => {
      setLoaded(visible);
      if (!visible) {
        setPdfReady(false); // 重置 PDF 准备状态
      }
    }, [visible]);
  
    useEffect(() => {
      if (state.length > 0 && loaded && pdfReady) {
        setLoaded(false);
        // 添加延迟确保 PDF 完全渲染
        setTimeout(() => {
          ref.current(state[0]);
        }, 1000);
      }
    }, [state, loaded, pdfReady]);
  
    // 如果抽屉不可见，不渲染 PDF 内容
    if (!visible) {
      return null;
    }

    return (
      <div 
        style={{ 
          height: '100%', 
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
        <div style={{ 
          flex: 1, 
          overflow: 'hidden',
        }}>
          <PdfLoader
            url={url}
            beforeLoad={<Skeleton active />}
            // workerSrc="/pdfjs-dist/pdf.worker.min.js"
          >
            {(pdfDocument) => {
              // 确保 pdfDocument 存在且已加载
              if (!pdfDocument) {
                return <div>PDF 文档加载中...</div>;
              }

              // 安全地获取页面信息
              try {
                pdfDocument.getPage(1).then((page) => {
                  const viewport = page.getViewport({ scale: 1 });
                  const width = viewport.width;
                  const height = viewport.height;
                  setWidthAndHeight(width, height);
                  setPdfReady(true); // 标记 PDF 已准备好
                }).catch((error) => {
                  console.warn('Failed to get page viewport:', error);
                });
              } catch (error) {
                console.warn('Error accessing PDF document:', error);
              }

              console.log('PDF Document loaded:', pdfDocument);
              return (
                <PdfHighlighter
                  pdfDocument={pdfDocument}
                  enableAreaSelection={(event) => event.altKey}
                  onScrollChange={resetHash}
                  scrollRef={(scrollTo) => {
                    ref.current = scrollTo;
                    setLoaded(true);
                  }}
                  onSelectionFinished={() => null}
                  highlightTransform={(
                    highlight,
                    index,
                    setTip,
                    hideTip,
                    viewportToScaled,
                    screenshot,
                    isScrolledTo,
                  ) => {
                    const isTextHighlight = !Boolean(
                      highlight.content && highlight.content.image,
                    );
    
                    const component = isTextHighlight ? (
                      <Highlight
                        isScrolledTo={isScrolledTo}
                        position={highlight.position}
                        comment={highlight.comment}
                      />
                    ) : (
                      <AreaHighlight
                        isScrolledTo={isScrolledTo}
                        highlight={highlight}
                        onChange={() => {}}
                      />
                    );
    
                    return (
                      <Popup
                        popupContent={<HighlightPopup {...highlight} />}
                        onMouseOver={(popupContent) =>
                          setTip(highlight, () => popupContent)
                        }
                        onMouseOut={hideTip}
                        key={index}
                      >
                        {component}
                      </Popup>
                    );
                  }}
                  highlights={pdfReady ? state : []}
                />
              );
            }}
          </PdfLoader>
        </div>
      </div>
    );
  };
  
  export default DocumentPreviewer;
  