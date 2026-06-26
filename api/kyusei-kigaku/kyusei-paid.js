// api/kyusei-kigaku/kyusei-paid.js
// 九星気学・¥500鑑定のエンドポイント。
// 入力：生年月日
// 出力：本命星＋性格・才能の詳しい解釈＋今年の運気（年盤の中心星との五行関係）
//
// このファイルはサーバー側でのみ実行され、ブラウザには送られない。

const { getHonmeisei, getHonmeiseiNumber, KYUSEI_NAMES, KYUSEI_GOGYO } = require('./honmeisei.js');
const { getYearFortune } = require('../shichu-suimei/gogyo-relation.js');

// 9つの本命星ごとの、性格・才能・適職の詳しい解釈（¥500鑑定用）
const HONMEISEI_PERSONALITY = {
  1: {
    trait: "一白水星のあなたは、水のように環境に合わせて形を変えられる、柔軟で適応力のある人です。表面は穏やかでも、内側には粘り強い意志を持っています。",
    talent: "状況を読み取る力、人の心情を察する力に優れています。一つの型にとらわれず、流れに合わせて動くことで力を発揮するタイプです。",
    job: "コンサルタント、カウンセリング、調整役、変化の多い業界"
  },
  2: {
    trait: "二黒土星のあなたは、大地のように物事をじっくり育てる、忍耐強く堅実な人です。地味に見えても、確実に物事を積み上げていく力を持っています。",
    talent: "持続力、人を支える力に長けています。すぐに結果が出ないことにも腰を据えて取り組めるタイプです。",
    job: "サポート職、人事・労務、農業・育成系、長期的な関係構築が必要な仕事"
  },
  3: {
    trait: "三碧木星のあなたは、若木のように勢いよく伸びていく、好奇心旺盛で発信力のある人です。新しいことに飛び込む怖さより、楽しさを感じるタイプです。",
    talent: "発信力、新しいことを始める力に長けています。先駆者として道を切り開く場面で力を発揮します。",
    job: "メディア・広報、企画職、スタートアップ、発信を伴う仕事"
  },
  4: {
    trait: "四緑木星のあなたは、風のように人と人をつなぐ、協調性と社交性に優れた人です。対立より調和を好み、周囲との関係を大切にします。",
    talent: "人をつなぐ力、信頼関係を築く力に長けています。チームの橋渡し役として力を発揮するタイプです。",
    job: "営業、人材関連、接客・サービス業、調整やつながりが重視される仕事"
  },
  5: {
    trait: "五黄土星のあなたは、大地の中心のように強い存在感を持つ、リーダー気質の人です。良くも悪くも周囲への影響力が大きい性質を持っています。",
    talent: "統率力、物事の中心に立つ力に長けています。困難な状況でも全体をまとめる場面で力を発揮します。",
    job: "経営、管理職、組織を率いる立場、責任の大きい仕事"
  },
  6: {
    trait: "六白金星のあなたは、天のように高い理想を持つ、誠実でまっすぐな人です。妥協を好まず、筋を通すことを大切にします。",
    talent: "信念を貫く力、物事を正しく進める力に長けています。公正さが求められる場面で力を発揮するタイプです。",
    job: "管理職、法務・コンプライアンス、公的な職務、規律が重視される仕事"
  },
  7: {
    trait: "七赤金星のあなたは、磨かれた金属のように洗練された、社交的で華やかな人です。人との関わりを楽しみ、場を盛り上げる才覚があります。",
    talent: "コミュニケーション力、場を明るくする力に長けています。人前に立つ場面、交渉の場面で力を発揮します。",
    job: "営業、接客、エンターテインメント、対人コミュニケーションが中心の仕事"
  },
  8: {
    trait: "八白土星のあなたは、山のように物事を積み重ねていく、忍耐力と変革力を併せ持つ人です。停滞した状況を大きく動かす力を秘めています。",
    talent: "蓄積する力、機を見て大きく動く力に長けています。じっくり力を蓄えた後、勝負所で結果を出すタイプです。",
    job: "不動産、金融、改革を伴う職種、長期計画を要する仕事"
  },
  9: {
    trait: "九紫火星のあなたは、火のように情熱的に物事を照らし出す、感性豊かで表現力のある人です。直感力に優れ、物事の本質を見抜く鋭さを持っています。",
    talent: "表現力、直感力に長けています。人の心を動かす場面、創造的な場面で力を発揮するタイプです。",
    job: "クリエイティブ職、教育、芸術・表現に関わる仕事、人前で発信する仕事"
  }
};

module.exports = (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  const { year, month, day } = body || {};
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);

  if (!y || !m || !d || y < 1900 || y > 2035 || m < 1 || m > 12 || d < 1 || d > 31) {
    res.status(400).json({ error: "生年月日が正しくありません。" });
    return;
  }

  try {
    const honmeisei = getHonmeisei(y, m, d);
    const personality = HONMEISEI_PERSONALITY[honmeisei.number];

    // 今年の運気：今年の年盤中心星を求め、本命星との五行関係を見る
    const thisYear = new Date().getFullYear();
    const thisYearCenterNumber = getHonmeiseiNumber(thisYear);
    const thisYearGogyo = KYUSEI_GOGYO[thisYearCenterNumber];
    const selfGogyo = honmeisei.gogyo;
    const yearFortune = getYearFortune(selfGogyo, thisYearGogyo);

    res.status(200).json({
      honmeisei: {
        number: honmeisei.number,
        name: honmeisei.name,
        gogyo: honmeisei.gogyo
      },
      personality: {
        trait: personality.trait,
        talent: personality.talent,
        job: personality.job
      },
      yearFortune: {
        year: thisYear,
        yearCenterName: KYUSEI_NAMES[thisYearCenterNumber],
        relation: yearFortune.relation,
        label: yearFortune.label,
        text: yearFortune.text
      }
    });
  } catch (e) {
    res.status(500).json({ error: "計算中にエラーが発生しました。生年月日をご確認ください。" });
  }
};
