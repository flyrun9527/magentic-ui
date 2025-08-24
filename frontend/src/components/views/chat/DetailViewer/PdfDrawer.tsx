import { Drawer } from 'antd';
import React from 'react';
import DocumentPreviewer from './DocumentPreviewer';
export interface IChunk {
  available_int: number; // Whether to enable, 0: not enabled, 1: enabled
  chunk_id: string;
  content_with_weight: string;
  doc_id: string;
  doc_name: string;
  image_id: string;
  important_kwd?: string[];
  question_kwd?: string[]; // keywords
  tag_kwd?: string[];
  positions: number[][];
  tag_feas?: Record<string, number>;
}
export interface IReferenceChunk {
  id: string;
  content: null;
  document_id: string;
  document_name: string;
  dataset_id: string;
  image_id: string;
  similarity: number;
  vector_similarity: number;
  term_similarity: number;
  positions: number[];
  doc_type?: string;
}

interface IProps {
  pdfUrl: string;
  chunk: IChunk | IReferenceChunk;
  visible: boolean;
  hideModal: () => void;
}

export const PdfDrawer = ({
  visible = false,
  hideModal,
  pdfUrl,
  chunk,
}: IProps) => {
  return (
    <Drawer
      title="文档预览"
      onClose={hideModal}
      open={visible}
      width={'50vw'}
      mask={false}
    >
      <DocumentPreviewer
        pdfUrl={pdfUrl}
        chunk={chunk}
        visible={visible}
      ></DocumentPreviewer>
    </Drawer>
  );
};

export default PdfDrawer;
