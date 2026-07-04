import React from "react";
import SectionHeader from "../components/SectionHeader";

export default function StudioSection({
  selectedTopic,
  setSelectedTopic,
  tone,
  setTone,
  tones,
  assetMode,
  assetModes = [],
  setAssetMode,
  copyPreview,
  onGenerate,
  isLoading,
}) {
  return (
    <article className="panel active">
      <SectionHeader
        eyebrow="SwarmClaw 风格引擎"
        title="AI 创作舱"
        action={
          <button
            className="primary-button panel-action"
            onClick={onGenerate}
            type="button"
            disabled={isLoading}
          >
            {isLoading ? "生成中..." : "执行 AI 生成"}
          </button>
        }
      />

      <div className="studio-grid">
        <section className="input-card">
          <label htmlFor="selected-topic">核心选题</label>
          <textarea
            id="selected-topic"
            rows="6"
            value={selectedTopic}
            onChange={(event) => setSelectedTopic(event.target.value)}
            disabled={isLoading}
          />

          <div className="control-row">
            <label htmlFor="tone-select">AI 语气</label>
            <select
              id="tone-select"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              disabled={isLoading}
            >
              {tones.map((toneName) => (
                <option key={toneName} value={toneName}>
                  {toneName}
                </option>
              ))}
            </select>
          </div>

          <div className="control-row">
            <label htmlFor="asset-select">自动生成配图/脚本</label>
            <select
              id="asset-select"
              value={assetMode}
              onChange={(event) => setAssetMode(event.target.value)}
              disabled={isLoading}
            >
              {assetModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="output-card">
          <p className="eyebrow">生成预览</p>
          <div className="copy-preview">{copyPreview}</div>
        </section>
      </div>
    </article>
  );
}
