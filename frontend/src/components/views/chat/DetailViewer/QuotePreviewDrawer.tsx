import React, { useState, useEffect } from 'react';
import { Drawer, Button, Spin } from 'antd';
import { X } from 'lucide-react';
import { 
  PdfLoader, 
  PdfHighlighter, 
  Highlight, 
  Popup, 
  AreaHighlight,
  IHighlight,
  ViewportHighlight,
} from 'react-pdf-highlighter';
// import "react-pdf-highlighter/dist/style.css";

// 定义位置接口
interface Position {
  page: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

// 定义组件 Props 接口
interface QuotePreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  position: Position;
}

// 定义评论接口
interface Comment {
  text: string;
  emoji: string;
}

// 扩展高亮接口
interface ExtendedHighlight extends IHighlight {
  comment: Comment;
}

const QuotePreviewDrawer: React.FC<QuotePreviewDrawerProps> = ({ 
  open, 
  onClose, 
  pdfUrl, 
  position 
}) => {
  const [highlights, setHighlights] = useState<ExtendedHighlight[]>([]);
  const [pdfLoaded, setPdfLoaded] = useState<boolean>(false);
  const [scrollAttempted, setScrollAttempted] = useState<boolean>(false);
  const [scrollFunction, setScrollFunction] = useState<((highlight: ExtendedHighlight) => void) | null>(null);

  // 根据传入的 position 参数创建高亮区域
  useEffect(() => {
    if (position && open) {
      console.log('Creating highlight with position:', position);
      
      // 创建符合 react-pdf-highlighter v8 格式的高亮对象
      // 注意：坐标系统可能需要转换，这里使用传入的原始坐标
      const highlight: ExtendedHighlight = {
        id: `highlight-${Date.now()}`,
        content: {
          text: '定位片段'
        },
        position: {
          boundingRect: {
            x1: position.left,
            y1: position.top,
            x2: position.left + position.width,
            y2: position.top + position.height,
            width: position.width,
            height: position.height,
            pageNumber: position.page
          },
          rects: [{
            x1: position.left,
            y1: position.top,
            x2: position.left + position.width,
            y2: position.top + position.height,
            width: position.width,
            height: position.height,
            pageNumber: position.page
          }],
          pageNumber: position.page
        },
        comment: {
          text: '定位的PDF片段',
          emoji: '📍'
        }
      };
      
      console.log('Position details:', {
        original: position,
        boundingRect: highlight.position.boundingRect,
        pageNumber: highlight.position.pageNumber
      });
      
      console.log('Created highlight:', highlight);
      setHighlights([highlight]);
    } else {
      setHighlights([]);
    }
  }, [position, open]);

  // 当抽屉关闭时重置状态
  useEffect(() => {
    if (!open) {
      console.log('抽屉关闭，重置状态');
      setScrollAttempted(false);
      setPdfLoaded(false);
      setScrollFunction(null);
    }
  }, [open]);

  // 当 position 改变时重置滚动状态
  useEffect(() => {
    if (position) {
      console.log('Position changed, resetting scroll state:', position);
      setScrollAttempted(false);
    }
  }, [position]);

  // 当 PDF 加载完成后尝试滚动到指定位置
  useEffect(() => {
    if (pdfLoaded && !scrollAttempted && position && highlights.length > 0) {
      console.log('PDF loaded, preparing to scroll to position');
      // 这里不直接滚动，而是等待 scrollRef 回调被调用
    }
  }, [pdfLoaded, scrollAttempted, position, highlights]);

  // 监听 pdfLoaded 状态变化，确保在 PDF 加载完成后能够正确触发滚动
  useEffect(() => {
    if (pdfLoaded && !scrollAttempted && position && highlights.length > 0 && scrollFunction) {
      console.log('All conditions met for scrolling. Position:', position, 'Highlights:', highlights);
      console.log('Using saved scroll function to scroll');
      setScrollAttempted(true);
      
      // 使用保存的滚动函数
      const attemptScrollWithSavedFunction = (retries: number = 3) => {
        setTimeout(() => {
          try {
            if (highlights[0] && highlights[0].position && scrollFunction) {
              console.log('Scrolling with saved function to position:', highlights[0].position);
              scrollFunction(highlights[0]);
              console.log('Scroll with saved function successful');
            } else {
              console.warn('Invalid highlight or scroll function for scrolling:', highlights[0], scrollFunction);
            }
          } catch (error) {
            console.warn('Scroll with saved function failed:', error);
            if (retries > 0) {
              console.log(`Retrying scroll with saved function, ${retries} attempts left`);
              attemptScrollWithSavedFunction(retries - 1);
            }
          }
        }, 2000); // 使用更长的延迟
      };
      
      attemptScrollWithSavedFunction();
    }
  }, [pdfLoaded, scrollAttempted, position, highlights, scrollFunction]);


  // 弹出提示组件
  const PopupComponent: React.FC<{ comment: Comment }> = ({ comment }) => {
    if (!comment.text) return <div></div>;
    
    return (
      <div style={{
        padding: '8px 12px',
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        border: '1px solid #d9d9d9',
        maxWidth: '200px'
      }}>
        <div style={{ fontSize: '14px', color: '#333' }}>
          {comment.emoji} {comment.text}
        </div>
      </div>
    );
  };

  return (
    <Drawer
      title="PDF 预览"
      placement="right"
      onClose={onClose}
      open={open}
      width="60%"
      style={{
        minWidth: '600px'
      }}
      extra={
        <Button 
          type="text" 
          icon={<X />} 
          onClick={onClose}
        />
      }
    >
      <div style={{ 
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
            url={pdfUrl} 
            beforeLoad={<div>加载中...</div>}
          >
            {(pdfDocument: any) => {
              console.log('PDF Document loaded, highlights:', highlights);
              return (
                <PdfHighlighter
                  pdfDocument={pdfDocument}
                  enableAreaSelection={(event: MouseEvent) => event.altKey}
                  onScrollChange={() => {}}
                  scrollRef={(scrollTo: (highlight: ExtendedHighlight) => void) => {
                    console.log('ScrollRef callback called, saving scroll function');
                    setScrollFunction(() => scrollTo);
                    
                    // 自动滚动到指定位置 - 只在PDF加载完成且未尝试过滚动时执行
                    if (pdfLoaded && !scrollAttempted && position && position.page && highlights.length > 0) {
                      console.log('Attempting to scroll to highlight:', highlights[0]);
                      console.log('PDF loaded:', pdfLoaded, 'Scroll attempted:', scrollAttempted);
                      setScrollAttempted(true);
                      
                      // 使用更长的延迟确保PDF完全渲染，并添加重试机制
                      const attemptScroll = (retries: number = 3) => {
                        setTimeout(() => {
                          try {
                            if (highlights[0] && highlights[0].position) {
                              console.log('Scrolling to position:', highlights[0].position);
                              scrollTo(highlights[0]);
                              console.log('Scroll successful');
                            } else {
                              console.warn('Invalid highlight for scrolling:', highlights[0]);
                            }
                          } catch (error) {
                            console.warn('Scroll failed:', error);
                            if (retries > 0) {
                              console.log(`Retrying scroll, ${retries} attempts left`);
                              attemptScroll(retries - 1);
                            }
                          }
                        }, 1500); // 增加延迟时间
                      };
                      
                      attemptScroll();
                    }
                  }}
                  onSelectionFinished={() => null}
                  highlightTransform={(
                    highlight: any,
                    index: number,
                    setTip: (highlight: any, callback: (highlight: any) => React.ReactElement) => void,
                    hideTip: () => void,
                    viewportToScaled: (rect: any) => any,
                    screenshot: (rect: any) => string,
                    isScrolledTo: boolean
                  ): React.ReactElement => {
                    // 安全检查：确保 highlight 和 position 存在
                    if (!highlight || !highlight.position) {
                      console.warn('Highlight or highlight.position is undefined:', highlight);
                      return <div key={index}></div>;
                    }

                    const typedHighlight = highlight as ViewportHighlight & { comment: Comment };
                    const isTextHighlight = !Boolean(typedHighlight.content && typedHighlight.content.image);
                    
                    const component = isTextHighlight ? (
                      <Highlight
                        position={highlight.position}
                        onClick={() => setTip(highlight, () => (
                          <PopupComponent comment={typedHighlight.comment} />
                        ))}
                        comment={typedHighlight.comment}
                        isScrolledTo={isScrolledTo}
                      />
                    ) : (
                      <AreaHighlight
                        highlight={highlight}
                        onChange={() => {}}
                        isScrolledTo={isScrolledTo}
                      />
                    );

                    return (
                      <Popup
                        popupContent={<PopupComponent comment={typedHighlight.comment} />}
                        onMouseOver={(popupContent: React.ReactElement) => 
                          setTip(highlight, () => popupContent)
                        }
                        onMouseOut={hideTip}
                        key={index}
                      >
                        {component}
                      </Popup>
                    );
                  }}
                  highlights={highlights}
                />
              );
            }}
            </PdfLoader>
        </div>
      </div>
    </Drawer>
  );
};

export default QuotePreviewDrawer;