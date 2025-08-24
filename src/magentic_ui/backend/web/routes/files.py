# api/files.py
import os
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from loguru import logger
import tempfile
import io
# from docx2pdf import convert as docx2pdf_convert

from magentic_ui.backend.utils.file_converter import ensure_pdf  # type: ignore

from ..deps import get_db
from ...datamodel import Run

router = APIRouter()


@router.get("/list/{run_id}")
async def list_files(run_id: int, db: Any = Depends(get_db)) -> Dict[str, Any]:
    """
    获取指定 run 目录下的文件列表
    
    Args:
        run_id: Run ID
        db: 数据库依赖
        
    Returns:
        文件列表信息
    """
    try:
        # 获取 run 信息
        run_response = db.get(Run, filters={"id": run_id}, return_json=False)
        if not run_response.status or not run_response.data:
            raise HTTPException(status_code=404, detail="Run not found")
        
        run_data = run_response.data[0] if isinstance(run_response.data, list) else run_response.data
        
        # 构建文件目录路径
        workspace_path = os.environ.get("INTERNAL_WORKSPACE_ROOT", "./workspace")
        run_suffix = os.path.join(
            "files",
            "user",
            str(run_data.user_id or "unknown_user"),
            str(run_data.session_id or "unknown_session"),
            str(run_data.id or "unknown_run"),
        )
        run_dir = os.path.join(workspace_path, run_suffix)
        
        # 检查目录是否存在
        if not os.path.exists(run_dir):
            return {"status": True, "data": {"files": [], "directory": run_dir}}
        
        # 获取文件列表
        exclude_files = ["supervisord.pid"]
        files = []
        for item in os.listdir(run_dir):
            if item in exclude_files:
                continue
            item_path = os.path.join(run_dir, item)
            if os.path.isfile(item_path):
                stat = os.stat(item_path)
                files.append({
                    "name": item,
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                    "type": "file"
                })
            elif os.path.isdir(item_path):
                stat = os.stat(item_path)
                files.append({
                    "name": item,
                    "size": 0,
                    "modified": stat.st_mtime,
                    "type": "directory"
                })
        
        # 按修改时间排序
        files.sort(key=lambda x: x["modified"], reverse=True)
        
        return {
            "status": True, 
            "data": {
                "files": files,
                "directory": run_dir,
                "run_id": run_id
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing files for run {run_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/upload/{run_id}")
async def upload_file(
    run_id: int, 
    file: UploadFile = File(...),
    db: Any = Depends(get_db)
) -> Dict[str, Any]:
    """
    上传文件到指定 run 目录
    
    Args:
        run_id: Run ID
        file: 上传的文件
        db: 数据库依赖
        
    Returns:
        上传结果
    """
    try:
        # 获取 run 信息
        run_response = db.get(Run, filters={"id": run_id}, return_json=False)
        if not run_response.status or not run_response.data:
            raise HTTPException(status_code=404, detail="Run not found")
        
        run_data = run_response.data[0] if isinstance(run_response.data, list) else run_response.data
        
        # 构建文件目录路径
        workspace_path = os.environ.get("INTERNAL_WORKSPACE_ROOT", "/app/workspace")
        run_suffix = os.path.join(
            "files",
            "user",
            str(run_data.user_id or "unknown_user"),
            str(run_data.session_id or "unknown_session"),
            str(run_data.id or "unknown_run"),
        )
        run_dir = os.path.join(workspace_path, run_suffix)
        
        # 创建目录
        os.makedirs(run_dir, exist_ok=True)
        
        # 保存文件
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename is required")
            
        file_path = os.path.join(run_dir, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"File uploaded: {file_path}")
        
        return {
            "status": True,
            "data": {
                "filename": file.filename,
                "size": len(content),
                "path": file_path
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file for run {run_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/download/{run_id}")
async def download_file(
    run_id: int, 
    filename: str,
    db: Any = Depends(get_db)
):
    """
    下载指定 run 目录下的文件
    
    Args:
        run_id: Run ID
        filename: 文件名
        db: 数据库依赖
        
    Returns:
        文件下载响应
    """
    try:
        # 获取 run 信息
        run_response = db.get(Run, filters={"id": run_id}, return_json=False)
        if not run_response.status or not run_response.data:
            raise HTTPException(status_code=404, detail="Run not found")
        
        run_data = run_response.data[0] if isinstance(run_response.data, list) else run_response.data
        
        # 构建文件路径
        workspace_path = os.environ.get("INTERNAL_WORKSPACE_ROOT", "./workspace")
        run_suffix = os.path.join(
            "files",
            "user",
            str(run_data.user_id or "unknown_user"),
            str(run_data.session_id or "unknown_session"),
            str(run_data.id or "unknown_run"),
        )
        run_dir = os.path.join(workspace_path, run_suffix)
        file_path = os.path.join(run_dir, filename)
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        if not os.path.isfile(file_path):
            raise HTTPException(status_code=400, detail="Path is not a file")
        
        # 返回文件下载响应
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file {filename} for run {run_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/delete/{run_id}")
async def delete_file(
    run_id: int, 
    filename: str,
    db: Any = Depends(get_db)
) -> Dict[str, Any]:
    """
    删除指定 run 目录下的文件
    
    Args:
        run_id: Run ID
        filename: 文件名
        db: 数据库依赖
        
    Returns:
        删除结果
    """
    try:
        # 获取 run 信息
        run_response = db.get(Run, filters={"id": run_id}, return_json=False)
        if not run_response.status or not run_response.data:
            raise HTTPException(status_code=404, detail="Run not found")
        
        run_data = run_response.data[0] if isinstance(run_response.data, list) else run_response.data
        
        # 构建文件路径
        workspace_path = os.environ.get("INTERNAL_WORKSPACE_ROOT", "./workspace")
        run_suffix = os.path.join(
            "files",
            "user",
            str(run_data.user_id or "unknown_user"),
            str(run_data.session_id or "unknown_session"),
            str(run_data.id or "unknown_run"),
        )
        run_dir = os.path.join(workspace_path, run_suffix)
        file_path = os.path.join(run_dir, filename)
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        if not os.path.isfile(file_path):
            raise HTTPException(status_code=400, detail="Path is not a file")
        
        # 删除文件
        os.remove(file_path)
        logger.info(f"File deleted: {file_path}")
        
        return {
            "status": True,
            "data": {
                "filename": filename,
                "message": "File deleted successfully"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file {filename} for run {run_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/convert/docx2pdf")
async def convert_docx_to_pdf(file: UploadFile = File(...)) -> StreamingResponse:
    """
    接收一个 .docx 文件，使用 docx2pdf 转换为 PDF，并返回 PDF 文件流
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename is required")

        if not file.filename.lower().endswith(".docx"):
            raise HTTPException(status_code=400, detail="Only .docx files are supported")

        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")

        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = os.path.join(tmpdir, os.path.basename(file.filename))
            with open(input_path, "wb") as f:
                f.write(content)

            # Only use remote Gotenberg conversion via ensure_pdf
            pdf_path, temp_pdf_to_delete = ensure_pdf(input_path, tmpdir)
            if not pdf_path or not os.path.exists(pdf_path):
                raise HTTPException(status_code=500, detail="Failed to create PDF via Gotenberg")

            with open(pdf_path, "rb") as pdf_file:
                pdf_bytes = pdf_file.read()

            # cleanup temp created by ensure_pdf
            try:
                if temp_pdf_to_delete and os.path.exists(temp_pdf_to_delete):
                    os.remove(temp_pdf_to_delete)
            except Exception:
                pass

            # Handle Unicode filename for output
            try:
                base_name = os.path.splitext(os.path.basename(file.filename))[0]
                # Try to encode as ASCII, replace non-ASCII with underscore
                safe_base_name = base_name.encode('ascii', 'replace').decode('ascii')
                output_basename = safe_base_name + ".pdf"
            except UnicodeEncodeError:
                # If encoding fails, use a hash of the original name
                import hashlib
                name_hash = hashlib.md5(file.filename.encode('utf-8')).hexdigest()[:8]
                output_basename = f"converted_{name_hash}.pdf"
            
            headers = {"Content-Disposition": f"attachment; filename=\"{output_basename}\""}
            return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting DOCX to PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/convert/docx2pdf/{run_id}")
async def convert_docx_to_pdf_from_run(
    run_id: int,
    filename: str,
    db: Any = Depends(get_db),
) -> StreamingResponse:
    """
    读取指定 run 目录下的 .docx 文件，转换为 PDF 并返回 PDF 文件流。
    
    缓存机制：
    - 如果同目录下已存在同名的 .pdf 文件，直接返回该文件
    - 如果不存在，则进行转换并将结果保存为同名 .pdf 文件供下次使用

    Query 参数:
      - filename: 需要转换的 .docx 文件名
    路径参数:
      - run_id: 运行 ID
    """
    try:
        if not filename or not filename.lower().endswith(".docx"):
            raise HTTPException(status_code=400, detail="filename 必须为 .docx 文件")

        # 获取 run 信息
        run_response = db.get(Run, filters={"id": run_id}, return_json=False)
        if not run_response.status or not run_response.data:
            raise HTTPException(status_code=404, detail="Run not found")

        run_data = run_response.data[0] if isinstance(run_response.data, list) else run_response.data

        # 构建文件路径
        workspace_path = os.environ.get("INTERNAL_WORKSPACE_ROOT", "./workspace")
        run_suffix = os.path.join(
            "files",
            "user",
            str(run_data.user_id or "unknown_user"),
            str(run_data.session_id or "unknown_session"),
            str(run_data.id or "unknown_run"),
        )
        run_dir = os.path.join(workspace_path, run_suffix)
        input_path = os.path.join(run_dir, filename)

        if not os.path.exists(input_path) or not os.path.isfile(input_path):
            raise HTTPException(status_code=404, detail="源 .docx 文件不存在")

        # 检查缓存：是否存在同名的PDF文件
        base_name = os.path.splitext(filename)[0]
        cached_pdf_path = os.path.join(run_dir, f"{base_name}.pdf")
        
        if os.path.exists(cached_pdf_path) and os.path.isfile(cached_pdf_path):
            # 缓存命中，直接返回已存在的PDF文件
            logger.info(f"Cache hit: Using existing PDF file {cached_pdf_path}")
            try:
                with open(cached_pdf_path, "rb") as pdf_file:
                    pdf_bytes = pdf_file.read()
                
                # Handle Unicode filename for output
                try:
                    safe_base_name = base_name.encode('ascii', 'replace').decode('ascii')
                    output_basename = safe_base_name + ".pdf"
                except UnicodeEncodeError:
                    import hashlib
                    name_hash = hashlib.md5(filename.encode('utf-8')).hexdigest()[:8]
                    output_basename = f"converted_{name_hash}.pdf"
                
                headers = {"Content-Disposition": f"inline; filename=\"{output_basename}\""}
                return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)
                
            except Exception as e:
                logger.warning(f"Failed to read cached PDF file {cached_pdf_path}: {str(e)}")
                # 如果读取缓存文件失败，继续执行转换流程

        # 缓存未命中，执行转换
        logger.info(f"Cache miss: Converting {filename} to PDF")
        with tempfile.TemporaryDirectory() as tmpdir:
            # 转换为 PDF（仅远程 Gotenberg）
            pdf_path, temp_pdf_to_delete = ensure_pdf(input_path, tmpdir)
            if not pdf_path or not os.path.exists(pdf_path):
                raise HTTPException(status_code=500, detail="PDF 生成失败 (Gotenberg)")

            with open(pdf_path, "rb") as pdf_file:
                pdf_bytes = pdf_file.read()

            # 保存转换结果到缓存
            try:
                with open(cached_pdf_path, "wb") as cache_file:
                    cache_file.write(pdf_bytes)
                logger.info(f"Saved converted PDF to cache: {cached_pdf_path}")
            except Exception as e:
                logger.warning(f"Failed to save PDF to cache {cached_pdf_path}: {str(e)}")

            # 清理 ensure_pdf 可能生成的临时文件
            try:
                if temp_pdf_to_delete and os.path.exists(temp_pdf_to_delete):
                    os.remove(temp_pdf_to_delete)
            except Exception:
                pass

            # Handle Unicode filename for output
            try:
                base_name = os.path.splitext(os.path.basename(filename))[0]
                # Try to encode as ASCII, replace non-ASCII with underscore
                safe_base_name = base_name.encode('ascii', 'replace').decode('ascii')
                output_basename = safe_base_name + ".pdf"
            except UnicodeEncodeError:
                # If encoding fails, use a hash of the original name
                import hashlib
                name_hash = hashlib.md5(filename.encode('utf-8')).hexdigest()[:8]
                output_basename = f"converted_{name_hash}.pdf"

        headers = {"Content-Disposition": f"inline; filename=\"{output_basename}\""}
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting DOCX to PDF for run {run_id}, file {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
