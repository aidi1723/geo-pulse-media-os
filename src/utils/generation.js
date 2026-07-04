function getTitleBlock(topicText) {
  return topicText.split(/\n\s*\n/)[0]?.trim() ?? "";
}

export function prepareGenerationPayload({
  topics,
  selectedTopic,
  tone,
  assetMode,
  scenarioKey,
}) {
  const topicText = selectedTopic.trim();

  if (!topicText) {
    throw new Error("请先输入核心选题");
  }

  const titleBlock = getTitleBlock(topicText);
  const matchedTopic = topics.find((item) => item.title === titleBlock) ?? null;

  return {
    tone,
    topicId: matchedTopic?.id,
    topicText,
    assetMode,
    scenarioKey,
  };
}
