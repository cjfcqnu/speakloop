import { useMemo, useState } from "react";
import type { ImportPreviewItem, Material } from "../types";
import { parseMaterialTxt, previewItemsToMaterials } from "../lib/importTxt";
import { Icon } from "../components/Icons";

export function ImportPage({
  saveMaterials,
  navigate,
}: {
  saveMaterials: (materials: Material[]) => Promise<void>;
  navigate: (path: string) => void;
}) {
  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState<ImportPreviewItem[]>([]);
  const [message, setMessage] = useState("");
  const validCount = useMemo(() => preview.filter((item) => item.isValid).length, [preview]);
  const failedCount = preview.length - validCount;

  const parseText = (text: string) => {
    setRawText(text);
    setPreview(parseMaterialTxt(text));
    setMessage("");
  };

  const handleFile = async (file?: File) => {
    if (!file) {
      return;
    }
    parseText(await file.text());
  };

  const confirmImport = async () => {
    const materials = previewItemsToMaterials(preview);
    await saveMaterials(materials);
    setMessage(`导入成功 ${materials.length} 条，失败 ${failedCount} 条。`);
    setPreview([]);
    setRawText("");
  };

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>导入素材</h1>
          <p>支持 TXT 批量导入，确认预览后才会保存。</p>
        </div>
      </section>

      <section className="import-panel">
        <label className="file-drop">
          <Icon name="upload" />
          <span>选择 TXT 文件</span>
          <input type="file" accept=".txt,text/plain" onChange={(event) => void handleFile(event.target.files?.[0])} />
        </label>
        <textarea
          value={rawText}
          onChange={(event) => parseText(event.target.value)}
          placeholder="也可以直接粘贴 TXT 内容进行预览"
          rows={8}
        />
        <div className="format-note">
          <strong>格式：</strong>场景、难度、中文、英文、标签。每条素材之间用空行分隔。
        </div>
      </section>

      {preview.length ? (
        <section className="section-block">
          <div className="section-heading">
            <h2>导入预览</h2>
            <span>
              可导入 {validCount} 条，失败 {failedCount} 条
            </span>
          </div>
          <div className="preview-list">
            {preview.map((item) => (
              <article className={`preview-card ${item.isValid ? "" : "invalid"}`} key={item.id}>
                <div className="pill-row">
                  <span className="pill">{item.scenario}</span>
                  <span className="pill">{item.difficulty}</span>
                  {!item.isValid ? <span className="pill danger">{item.error}</span> : null}
                </div>
                <p className="sentence-en">{item.en || "英文为空"}</p>
                <p className="sentence-zh">{item.zh || "无中文解释"}</p>
                <div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
              </article>
            ))}
          </div>
          <button className="primary-button full-width" disabled={validCount === 0} onClick={confirmImport} type="button">
            <Icon name="check" />
            确认导入
          </button>
        </section>
      ) : null}

      {message ? (
        <section className="success-box">
          <strong>{message}</strong>
          <button className="secondary-button" onClick={() => navigate("/materials")} type="button">
            查看素材库
          </button>
        </section>
      ) : null}
    </div>
  );
}
