import React, { useState } from 'react';
import { Button } from 'antd';
import QuotePreviewDrawer from './QuotePreviewDrawer';
import { getServerUrl } from '../../../utils';
import PdfDrawer, { IChunk, IReferenceChunk } from './PdfDrawer';

/**
 * PDF 高亮测试组件
 * 用于测试和调试 QuotePreviewDrawer 组件的 PDF 预览和片段定位功能
 */
const PDFHighlighterTest: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [testPosition, setTestPosition] = useState({
    page: 1,
    left: 100,
    top: 200,
    width: 300,
    height: 50
  });

  // 测试不同的位置参数
  const testPositions = [
    {
      name: '第1页顶部',
      position: { page: 1, left: 50, top: 100, width: 400, height: 30 }
    },
    {
      name: '第1页中部',
      position: { page: 1, left: 100, top: 300, width: 350, height: 40 }
    },
    {
      name: '第1页底部',
      position: { page: 1, left: 80, top: 600, width: 300, height: 35 }
    },
    {
      name: '第2页顶部',
      position: { page: 2, left: 100, top: 100, width: 400, height: 30 }
    }
  ];

  const handleTestPosition = (position: typeof testPosition) => {
    console.log('Testing position:', position);
    setTestPosition(position);
    setIsDrawerOpen(true);
  };

  const chunk :IChunk = {
    available_int: 1,
    chunk_id: '1',
    content_with_weight: 'test',
    doc_id: '1',
    doc_name: 'test',
    image_id: '1',
    positions: [
      [14, 115, 310, 690, 710],
      [15, 80, 510, 75, 710]
    ]
  };
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">PDF 高亮定位测试</h2>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          点击下面的按钮测试不同位置的 PDF 片段定位功能：
        </p>
        
        {testPositions.map((test, index) => (
          <Button
            key={index}
            onClick={() => handleTestPosition(test.position)}
            className="mr-2 mb-2"
          >
            测试 {test.name}
          </Button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">当前测试位置：</h3>
        <pre className="text-sm">
          {JSON.stringify(testPosition, null, 2)}
        </pre>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">调试说明：</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>打开浏览器开发者工具查看控制台日志</li>
          <li>检查 PDF 是否正确加载</li>
          <li>观察高亮区域是否正确显示</li>
          <li>验证自动滚动是否工作</li>
        </ul>
      </div>

      {/* <QuotePreviewDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        // pdfUrl={`${getServerUrl()}/files/convert/docx2pdf/11?filename=信息化建设类合同.docx`}
        pdfUrl="https://arxiv.org/pdf/1708.08021"
        position={testPosition}
      /> */}
      <PdfDrawer
        pdfUrl={`${getServerUrl()}/files/convert/docx2pdf/11?filename=信息化建设类合同.docx`}
        // pdfUrl="https://arxiv.org/pdf/1708.08021"
        chunk={chunk}
        visible={isDrawerOpen}
        hideModal={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default PDFHighlighterTest;