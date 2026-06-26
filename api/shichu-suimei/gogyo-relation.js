// gogyo-relation.js
// 五行（木火土金水）の関係性を判定するモジュール。
// 「今年の運気」を出すために、日干（自分の核となる五行）と
// 今年の干（歳運の五行）の関係を見る。

const GOGYO_ORDER = ["木", "火", "土", "金", "水"];

// 相生（そうじょう）: 育てる・生み出す関係（木→火→土→金→水→木）
const SOSEI_NEXT = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
// 相剋（そうこく）: 抑える・打ち消す関係（木→土→水→火→金→木）
const SOKOKU_NEXT = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" };

// 日干の五行(self) に対して、対象の五行(target)がどういう関係かを判定する
function getRelation(selfGogyo, targetGogyo) {
  if (selfGogyo === targetGogyo) return "比和"; // 同じ五行（仲間が増える年）
  if (SOSEI_NEXT[selfGogyo] === targetGogyo) return "我生"; // 自分が生み出す（自分の力を使う年）
  if (SOSEI_NEXT[targetGogyo] === selfGogyo) return "生我"; // 自分を生んでくれる（後押しされる年）
  if (SOKOKU_NEXT[selfGogyo] === targetGogyo) return "我剋"; // 自分が抑える（自分が主導する年）
  if (SOKOKU_NEXT[targetGogyo] === selfGogyo) return "剋我"; // 自分が抑えられる（慎重さが必要な年）
  return "不明";
}

// 関係性ごとの、今年の運気の説明テンプレート
const RELATION_TEXT = {
  "生我": {
    label: "後押しされる年",
    text: "今年の巡りは、あなたを後ろから支えてくれる五行にあたります。周囲からの助けや、思いがけない後押しを受けやすい年です。新しいことを始めるにも良いタイミングと言えます。"
  },
  "我生": {
    label: "力を使う年",
    text: "今年の巡りは、あなたが力を注ぎ込む側にあたる五行です。自分から動いた分だけ結果が返ってくる年で、受け身でいるよりも、主体的に取り組むことで運気を活かせます。"
  },
  "比和": {
    label: "勢いが増す年",
    text: "今年の巡りは、あなたと同じ五行にあたります。普段の自分の性質がそのまま強まりやすい年で、得意なことはより伸び、苦手なことはより目立ちやすくなる傾向があります。"
  },
  "我剋": {
    label: "自分が主導する年",
    text: "今年の巡りは、あなたが抑える側にあたる五行です。物事を自分でコントロールしやすい反面、力を使う分、息切れしないよう力の配分を意識すると良い年です。"
  },
  "剋我": {
    label: "慎重さが必要な年",
    text: "今年の巡りは、あなたを抑える側にあたる五行です。普段より制約や試練を感じやすい年ですが、無理をせず慎重に進めば、後の安定につながる年でもあります。"
  },
  "不明": {
    label: "巡りを確認中",
    text: "今年の運気の巡りを確認しています。"
  }
};

function getYearFortune(selfGogyo, yearGogyo) {
  const relation = getRelation(selfGogyo, yearGogyo);
  const info = RELATION_TEXT[relation];
  return {
    relation: relation,
    label: info.label,
    text: info.text
  };
}

module.exports = { getRelation, getYearFortune, GOGYO_ORDER, SOSEI_NEXT, SOKOKU_NEXT };
