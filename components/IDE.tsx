import React, { useState } from 'react';
import { StrategyMode } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface IDEProps {
  code: string;
  strategyLogic: string;
  isGenerating: boolean;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  strategyMode: StrategyMode;
  onToolAction: (prompt: string) => void;
}

// --- Configuration Types ---

type ParamType = 'text' | 'number' | 'select' | 'textarea';

interface ToolParam {
  key: string;
  label: string;
  type?: ParamType; // Defaults to 'text'
  placeholder?: string;
  default?: string;
  options?: string[]; // For 'select' type
  rows?: number; // For 'textarea'
}

interface ToolItem {
  label: string;
  desc?: string; 
  prompt: string; 
  params?: ToolParam[];
}

interface ModeTheme {
  color: string;
  bg: string;
  hoverBg: string;
  icon: React.ReactNode;
  tools: ToolItem[];
}

// --- Tool Configurations ---

const MODE_CONFIG: Record<StrategyMode, ModeTheme> = {
  [StrategyMode.TRADITIONAL]: {
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    hoverBg: 'hover:bg-blue-50',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>,
    tools: [
      { 
        label: 'MA 双均线系统', 
        desc: '趋势跟踪基石', 
        prompt: '请实现双均线交叉策略。短期均线窗口为 {{short}}，长期均线窗口为 {{long}}。当短线上穿长线时买入，下穿时卖出。',
        params: [
          { key: 'short', label: '短周期', type: 'number', default: '5' },
          { key: 'long', label: '长周期', type: 'number', default: '20' }
        ]
      },
      { 
        label: 'MACD 指标', 
        desc: '异同移动平均线', 
        prompt: '请计算 MACD 指标 (Fast={{fast}}, Slow={{slow}}, Signal={{signal}})，并在 DIF 上穿 DEA 时产生买入信号。',
        params: [
          { key: 'fast', label: '快线周期', type: 'number', default: '12' },
          { key: 'slow', label: '慢线周期', type: 'number', default: '26' },
          { key: 'signal', label: '信号线周期', type: 'number', default: '9' }
        ]
      },
      { 
        label: 'KDJ 随机指标', 
        desc: '超买超卖与背离', 
        prompt: '请计算 KDJ 随机指标，参数设定为 N={{n}}, M1={{m1}}, M2={{m2}}。关注 K 线与 D 线的金叉死叉以及 J 线的极值。',
        params: [
          { key: 'n', label: '周期 N', type: 'number', default: '9' },
          { key: 'm1', label: '平滑 M1', type: 'number', default: '3' },
          { key: 'm2', label: '平滑 M2', type: 'number', default: '3' }
        ]
      },
      { 
        label: 'RSI 相对强弱', 
        desc: '震荡指标', 
        prompt: '请计算 {{period}} 日 RSI 指标。当 RSI 低于 {{lower}} 时视为超卖（买入机会），高于 {{upper}} 时视为超买（卖出风险）。',
        params: [
          { key: 'period', label: '计算周期', type: 'number', default: '14' },
          { key: 'lower', label: '超卖阈值', type: 'number', default: '30' },
          { key: 'upper', label: '超买阈值', type: 'number', default: '70' }
        ]
      },
      { 
        label: '布林带 (Bollinger)', 
        desc: '波动率通道', 
        prompt: '请计算布林带 (Period={{period}}, StdDev={{std}})。逻辑：价格突破上轨做多/做空，或价格回归中轨交易。',
        params: [
          { key: 'period', label: '均线周期', type: 'number', default: '20' },
          { key: 'std', label: '标准差倍数', type: 'number', default: '2.0' }
        ]
      },
      {
        label: 'Donchian Channel',
        desc: '唐奇安通道 (突破)',
        prompt: '请实现 Donchian Channel (唐奇安通道) 策略。计算过去 {{n}} 天的最高价和最低价。突破上轨买入，跌破下轨卖出。',
        params: [{ key: 'n', label: '周期', default: '20' }]
      },
      { 
        label: 'ATR 动态止损', 
        desc: '基于波动率的风控', 
        prompt: '请计算 ATR (Average True Range, 周期={{period}})。使用 {{multiplier}} 倍 ATR 作为移动止损 (Trailing Stop) 的宽度。',
        params: [
          { key: 'period', label: 'ATR 周期', type: 'number', default: '14' },
          { key: 'multiplier', label: '止损倍数', type: 'number', default: '2.5' }
        ]
      },
      { label: 'CCI 顺势指标', desc: '商品路径指标', prompt: '请计算 CCI 指标 (周期={{n}})。当 CCI 大于 100 时看多，小于 -100 时看空。', params: [{key: 'n', label: '周期', default: '14'}] },
      { label: 'Williams %R', desc: '威廉指标', prompt: '请计算 Williams %R (周期={{n}})。用于判断市场的超买/超卖状态。', params: [{key: 'n', label: '周期', default: '14'}] },
      { label: 'MFI 资金流量', desc: '成交量加权RSI', prompt: '请计算 MFI (Money Flow Index)。该指标结合了价格和成交量，用于判断资金流向强度。' },
      { label: 'VWAP 策略', desc: '成交量加权均价', prompt: '请计算日内 VWAP。策略逻辑：当价格位于 VWAP 之上时只做多，位于 VWAP 之下时只做空，结合量能判断趋势。' },
      { label: 'OBV 能量潮', desc: '量价分析', prompt: '请计算 OBV (On-Balance Volume) 指标。逻辑：确认价格趋势是否得到成交量的配合（量价背离检测）。' },
      { 
        label: 'Ichimoku 云图', 
        desc: '一目均衡表', 
        prompt: '请实现 Ichimoku 系统。Tenkan={{tenkan}}, Kijun={{kijun}}, Senkou={{senkou}}。依据价格是否在云层上方判断趋势。',
        params: [
          { key: 'tenkan', label: '转折线', default: '9' },
          { key: 'kijun', label: '基准线', default: '26' },
          { key: 'senkou', label: '先行带B', default: '52' }
        ]
      },
      {
        label: 'Parabolic SAR',
        desc: '抛物线转向',
        prompt: '请计算抛物线 SAR 指标 (Step={{step}}, Max={{max}})，作为趋势反转和止损的参考点。',
        params: [
          { key: 'step', label: '步长', default: '0.02' },
          { key: 'max', label: '最大值', default: '0.2' }
        ]
      }
    ]
  },
  [StrategyMode.STATISTICAL]: {
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    hoverBg: 'hover:bg-purple-50',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    tools: [
      { 
        label: 'Z-Score 均值回归', 
        desc: 'Rolling Z-Score', 
        prompt: '请计算价格序列的 Rolling Z-Score (Window={{window}})。当 Z-Score > {{thresh}} 做空，< -{{thresh}} 做多，回归到 0 平仓。',
        params: [
          { key: 'window', label: '滚动窗口', default: '20' },
          { key: 'thresh', label: '阈值', default: '2.0' }
        ]
      },
      { 
        label: 'Pairs Trading (EG协整)', 
        desc: 'Engle-Granger Two-Step', 
        prompt: '请对两只标的 ({{asset1}} 和 {{asset2}}) 进行 Engle-Granger 协整检验。如果 p-value < 0.05，则基于价差 (Spread) 进行均值回归交易。',
        params: [
          { key: 'asset1', label: '标的 A', placeholder: '如 600000.SH' },
          { key: 'asset2', label: '标的 B', placeholder: '如 600036.SH' }
        ]
      },
      { 
        label: 'Johansen Test', 
        desc: '多资产协整检验', 
        prompt: '请使用 Johansen Test 检验多只资产是否存在协整关系。这比 EG 检验更适合多资产组合套利策略。' 
      },
      { label: 'Hurst 指数', desc: '长记忆性检验', prompt: '请计算 Hurst Exponent (Lag={{lag}})。若 H<0.5 使用均值回归策略，H>0.5 使用趋势跟踪策略。', params: [{key: 'lag', label: 'Lag', default: '100'}] },
      { label: 'ADF 平稳性检验', desc: '单位根检验', prompt: '请使用 Augmented Dickey-Fuller Test 检验时间序列的平稳性，确保统计套利模型的有效性。' },
      { label: 'Variance Ratio Test', desc: '随机游走检验', prompt: '请使用 Lo-MacKinlay Variance Ratio Test 检验价格序列是否遵循随机游走。如果拒绝随机游走假设，则市场可能存在可预测性。' },
      { label: 'Kalman Filter', desc: '动态对冲比率', prompt: '请使用 Kalman Filter 动态估计 Hedge Ratio (对冲比例)，用于配对交易中的 Beta 实时调整，比 OLS 回归更灵敏。' },
      { 
        label: 'GARCH 模型', 
        desc: '波动率建模', 
        prompt: '请使用 GARCH({{p}}, {{q}}) 模型建模收益率的波动率聚集现象，并将预测波动率作为风险控制指标。',
        params: [
          { key: 'p', label: 'Lag (p)', default: '1' },
          { key: 'q', label: 'Error (q)', default: '1' }
        ]
      },
      { label: 'Half-Life 半衰期', desc: 'OU 过程拟合', prompt: '请通过拟合 Ornstein-Uhlenbeck 过程，计算均值回归的半衰期 (Half-Life)，以此设定最佳持有周期。' },
      { label: 'PCA 主成分分析', desc: '统计因子降维', prompt: '请对多个相关性较高的因子进行 PCA 降维，提取前 {{n}} 个主成分作为正交的新因子进行建模。', params: [{key: 'n', label: '主成分数量', default: '3'}] },
      { label: 'Spearman Rank Corr', desc: '非线性相关', prompt: '请计算 Spearman Rank Correlation (斯皮尔曼等级相关系数)，用于捕捉非线性的单调依赖关系。' },
      { label: 'Granger Causality', desc: '预测性因果检验', prompt: '请进行 Granger Causality Test，检验资产 A 的滞后项是否有助于预测资产 B。' },
      { label: 'Mann-Kendall Test', desc: '趋势显著性', prompt: '请使用 Mann-Kendall Trend Test 非参数检验方法，确认时间序列是否存在显著的单调趋势。' },
    ]
  },
  [StrategyMode.ML]: {
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    hoverBg: 'hover:bg-orange-50',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
    tools: [
      { 
        label: 'CatBoost', 
        desc: '类别特征处理专家', 
        prompt: '请使用 CatBoostClassifier。参数：Iterations={{iter}}, Learning Rate={{lr}}, Depth={{depth}}。重点利用其处理 Categorical Features 的能力。',
        params: [
          { key: 'iter', label: '迭代次数', type: 'number', default: '500' },
          { key: 'lr', label: '学习率', type: 'number', default: '0.05' },
          { key: 'depth', label: '树深度', type: 'number', default: '6' }
        ]
      },
      { 
        label: 'XGBoost / LightGBM', 
        desc: '高效梯度提升树', 
        prompt: '请集成 {{model}} 模型。Objective 设置为 {{obj}}，使用 Early Stopping 防止过拟合。',
        params: [
          { key: 'model', label: '模型选择', type: 'select', options: ['LightGBM', 'XGBoost'], default: 'LightGBM' },
          { key: 'obj', label: '目标函数', type: 'select', options: ['binary', 'multiclass', 'regression'], default: 'binary' }
        ]
      },
      { 
        label: 'SVM 支持向量机', 
        desc: '小样本分类强', 
        prompt: '请使用 SVM (Support Vector Machine) 进行分类。Kernel={{kernel}}, C={{c}}。注意先对数据进行标准化 (StandardScaler)。',
        params: [
          { key: 'kernel', label: '核函数', type: 'select', options: ['rbf', 'linear', 'poly'], default: 'rbf' },
          { key: 'c', label: '惩罚系数 C', default: '1.0' }
        ] 
      },
      { label: 'AdaBoost', desc: '自适应增强', prompt: '请使用 AdaBoost 算法，以 Decision Tree 为基分类器，通过加权错误样本提升整体预测精度。' },
      { label: 'Random Forest', desc: '随机森林', prompt: '请使用 RandomForest 作为基准模型，设置 n_estimators={{n}}，利用 OOB Score 进行评估。', params: [{key: 'n', label: '树数量', default: '200'}] },
      { label: 'Naive Bayes', desc: '朴素贝叶斯', prompt: '请使用 Gaussian Naive Bayes 模型。这是一种基于概率的简单分类器，适合作为 Baseline 比较。' },
      { label: 'KNN', desc: 'K-近邻', prompt: '请使用 K-Nearest Neighbors (KNN) 算法。K={{k}}。这是一种基于实例的学习方法。', params: [{key: 'k', label: 'K值', default: '5'}] },
      { 
        label: '数据标注 (Labeling)', 
        desc: 'Triple Barrier Method', 
        prompt: '请使用 Triple Barrier Method (三重大门法) 进行数据标注。设置止盈阈值 {{tp}}，止损阈值 {{sl}}，持有期 {{window}}。',
        params: [
          { key: 'tp', label: '止盈阈值', default: '0.02' },
          { key: 'sl', label: '止损阈值', default: '0.01' },
          { key: 'window', label: '持有窗口', default: '10' }
        ]
      },
      { label: 'Purged K-Fold', desc: '防泄露交叉验证', prompt: '请实现 Purged K-Fold Cross Validation。在训练集和测试集之间加入 "Embargo" (隔离期)，防止时序数据相关性导致的数据泄露。' },
      { label: 'SMOTE 采样', desc: '非平衡数据处理', prompt: '请使用 SMOTE (Synthetic Minority Over-sampling Technique) 对训练集中的少数类样本进行过采样，解决正负样本不平衡问题。' },
      { label: 'Feature Importance', desc: '特征重要性分析', prompt: '请计算并可视化特征重要性。方法：{{method}} (Permutation Importance 或 SHAP values)。', params: [{key: 'method', label: '方法', type: 'select', options: ['Permutation', 'SHAP', 'Gain'], default: 'Permutation'}] },
      { label: 'Grid Search / Optuna', desc: '超参数自动调优', prompt: '请添加 {{method}} 代码框架，对模型的关键参数（如学习率、树深、正则化系数）进行自动寻优。', params: [{key: 'method', label: '库选择', type: 'select', options: ['GridSearchCV', 'Optuna'], default: 'Optuna'}] },
      { label: 'Isolation Forest', desc: '异常值检测', prompt: '请使用 Isolation Forest (孤立森林) 检测市场数据中的异常点 (Outliers)，并在训练前将其剔除或作为特征使用。' },
      { label: 'K-Means Clustering', desc: '市场状态聚类', prompt: '请使用 K-Means 对市场特征进行聚类，识别不同的市场状态 (Market Regimes)，并针对不同状态训练独立模型。' },
    ]
  },
  [StrategyMode.DL]: {
    color: 'text-rose-600',
    bg: 'bg-gray-800', 
    hoverBg: 'hover:bg-gray-700',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    tools: [
      { 
        label: 'AlphaGPT: 增加算子', 
        desc: '扩展搜索空间', 
        prompt: '请在 AlphaGPT 框架的 OPS_CONFIG 中增加以下数学算子：{{ops}}。请确保实现了对应的 torch 函数。',
        params: [
          { key: 'ops', label: '算子列表 (逗号分隔)', placeholder: '如: Log, Exp, Tanh, Sigmoid, Ts_ArgMax, Ts_Rank', type: 'textarea', rows: 2 }
        ] 
      },
      { 
        label: '自定义 Loss 函数', 
        desc: '自然语言定义目标', 
        prompt: '请实现一个自定义损失函数 class CustomLoss(nn.Module)。\n具体逻辑要求如下：\n{{desc}}',
        params: [
          { 
            key: 'desc', 
            label: '损失函数逻辑描述', 
            type: 'textarea', 
            rows: 4, 
            placeholder: '例如：我想最大化夏普比率。Loss = - (Mean_Ret / Std_Ret)。同时请加入一个正则项，惩罚每一期的换手率 (Turnover)，系数为 0.1。' 
          }
        ]
      },
      { 
        label: '自定义层结构', 
        desc: 'LSTM/GRU/Transformer', 
        prompt: '请在模型中添加 {{layers}} 层 {{type}} 结构，Hidden Size 设为 {{hidden}}，Dropout 设为 {{dropout}}。',
        params: [
          { key: 'type', label: '层类型', type: 'select', options: ['LSTM', 'GRU', 'TransformerEncoder'], default: 'LSTM' },
          { key: 'layers', label: '层数', type: 'number', default: '2' },
          { key: 'hidden', label: '隐藏层维度', type: 'number', default: '128' },
          { key: 'dropout', label: 'Dropout', type: 'number', default: '0.2' }
        ]
      },
      { label: 'Attention 机制', desc: 'Self-Attention', prompt: '请在时间序列编码器后引入 Multi-head Self-Attention 机制，Head数量={{heads}}，增强对关键时间节点的捕捉。', params: [{key: 'heads', label: 'Heads Num', default: '4'}] },
      { label: 'TCN 网络', desc: '时间卷积网络', prompt: '请引入 Temporal Convolutional Network (TCN) 结构，使用膨胀卷积 (Dilated Conv) 捕捉长短期依赖，Kernel Size={{k}}。', params: [{key: 'k', label: 'Kernel Size', default: '3'}] },
      { label: 'Autoencoder', desc: '降噪自编码器', prompt: '请构建一个 Denoising Autoencoder (DAE) 来提取市场数据的鲁棒特征，作为下游策略模型的输入。' },
      { label: 'WaveNet', desc: '因果膨胀卷积', prompt: '请引入 WaveNet 结构，利用堆叠的因果膨胀卷积层 (Causal Dilated Convolutions) 直接预测原始价格序列或收益率。' },
      { label: 'DQN (RL)', desc: '深度强化学习', prompt: '请构建一个 Deep Q-Network (DQN) agent。State为过去N天的因子，Action为{买入, 卖出, 持有}，Reward为夏普比率。' },
      { label: 'ResNet Block', desc: '残差连接', prompt: '请构建 ResNet Block (残差块)，在深层网络中使用 Skip Connection 防止梯度消失问题。' },
      { label: 'Transformer Decoder', desc: '生成式结构', prompt: '请引入 Transformer Decoder 结构，使用 Causal Mask，使其能够像 GPT 一样自回归地预测下一期收益率。' },
      { label: 'TFT Transformer', desc: '时序融合变换器', prompt: '请引入 Temporal Fusion Transformer (TFT)，这是一种专门针对多变量时间序列预测的可解释性 Transformer 架构。' },
      { label: 'Mamba / SSM', desc: '状态空间模型', prompt: '请尝试引入 Mamba (State Space Model) 模块替换传统的 Transformer，以降低长序列计算的复杂度并提升推理速度。' },
      { label: 'GNN 图神经网络', desc: '股票关联关系', prompt: '请构建 Graph Neural Network (GNN)。将股票视为节点，产业链或相关性视为边，利用 GAT (Graph Attention) 聚合邻居信息。' },
      { label: 'Adversarial Training', desc: '对抗攻击训练', prompt: '请引入 FGM (Fast Gradient Method) 对抗训练策略。在 Embedding 层添加微小扰动进行训练，提升模型的鲁棒性和泛化能力。' },
    ]
  }
};

// --- Main Component ---

const IDE: React.FC<IDEProps> = ({ 
  code, 
  strategyLogic, 
  isGenerating,
  isFullScreen,
  onToggleFullScreen,
  strategyMode,
  onToolAction
}) => {
  const [activeTab, setActiveTab] = useState<'logic' | 'code'>('logic');
  const [activeTool, setActiveTool] = useState<ToolItem | null>(null);
  const [toolParams, setToolParams] = useState<Record<string, string>>({});
  
  // Auto-switch tabs
  React.useEffect(() => {
    if (code && !strategyLogic) setActiveTab('code');
    if (strategyLogic && !code) setActiveTab('logic');
    if (code && strategyLogic) setActiveTab('code'); 
  }, [code, strategyLogic]);

  const theme = MODE_CONFIG[strategyMode] || MODE_CONFIG[StrategyMode.TRADITIONAL];
  const isDarkTheme = strategyMode === StrategyMode.DL;

  const handleToolClick = (tool: ToolItem) => {
    if (tool.params && tool.params.length > 0) {
      // Open Modal
      const initialParams: Record<string, string> = {};
      tool.params.forEach(p => initialParams[p.key] = p.default || '');
      setToolParams(initialParams);
      setActiveTool(tool);
    } else {
      // Send directly
      onToolAction(tool.prompt);
    }
  };

  const handleModalSubmit = () => {
    if (!activeTool) return;
    let finalPrompt = activeTool.prompt;
    
    // Replace placeholders
    Object.keys(toolParams).forEach(key => {
      finalPrompt = finalPrompt.replace(new RegExp(`{{${key}}}`, 'g'), toolParams[key]);
    });
    
    onToolAction(finalPrompt);
    setActiveTool(null);
  };

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy_${Date.now()}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderParamInput = (param: ToolParam) => {
    const commonClasses = `text-xs p-2 rounded border focus:ring-1 outline-none w-full ${
      isDarkTheme 
        ? 'bg-[#1e1e1e] border-[#3e3e42] text-gray-200 focus:border-blue-500' 
        : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500'
    }`;

    if (param.type === 'select' && param.options) {
      return (
        <select
          value={toolParams[param.key]}
          onChange={e => setToolParams({...toolParams, [param.key]: e.target.value})}
          className={commonClasses}
        >
          {param.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (param.type === 'textarea') {
       return (
         <textarea
            value={toolParams[param.key]}
            onChange={e => setToolParams({...toolParams, [param.key]: e.target.value})}
            className={`${commonClasses} resize-none`}
            rows={param.rows || 3}
            placeholder={param.placeholder || param.default}
         />
       );
    }

    return (
      <input 
        type={param.type || 'text'}
        value={toolParams[param.key]}
        onChange={e => setToolParams({...toolParams, [param.key]: e.target.value})}
        className={commonClasses}
        placeholder={param.placeholder || param.default}
      />
    );
  };

  return (
    <div className={`h-full flex flex-col relative ${isDarkTheme ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
      
      {/* --- Tool Parameter Modal --- */}
      {activeTool && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
           <div className={`w-80 rounded-lg shadow-2xl border flex flex-col max-h-full ${
             isDarkTheme ? 'bg-[#252526] border-[#3e3e42]' : 'bg-white border-gray-200'
           }`}>
              <div className="flex justify-between items-center border-b px-4 py-3 border-gray-100/10 shrink-0">
                <div>
                   <h4 className={`text-sm font-bold ${isDarkTheme ? 'text-gray-200' : 'text-gray-800'}`}>{activeTool.label}</h4>
                   {activeTool.desc && <p className={`text-[10px] ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>{activeTool.desc}</p>}
                </div>
                <button onClick={() => setActiveTool(null)} className="text-gray-400 hover:text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {activeTool.params?.map(param => (
                  <div key={param.key} className="flex flex-col gap-1.5">
                     <label className={`text-[10px] uppercase font-bold tracking-wider ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                       {param.label}
                     </label>
                     {renderParamInput(param)}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 p-3 border-t border-gray-100/10 shrink-0">
                 <button 
                   onClick={() => setActiveTool(null)}
                   className={`text-xs px-3 py-1.5 rounded ${isDarkTheme ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleModalSubmit}
                   className={`text-xs px-3 py-1.5 rounded font-medium text-white ${
                     isDarkTheme ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-900 hover:bg-black'
                   }`}
                 >
                   发送指令
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* IDE Toolbar */}
      <div className={`flex items-center justify-between px-4 border-b h-10 shrink-0 transition-colors ${
        isDarkTheme 
          ? 'bg-[#252526] border-[#3e3e42] text-gray-300' 
          : 'bg-mac-gray/50 border-mac-border/50 text-gray-700'
      }`}>
        <div className="flex items-center gap-4 h-full">
          <div className="flex gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          
          <button 
            onClick={() => setActiveTab('logic')}
            className={`h-full flex items-center px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'logic' 
                ? `${theme.color} border-current ${isDarkTheme ? 'bg-white/5' : 'bg-white/50'}`
                : 'border-transparent text-gray-500 hover:text-gray-400'
            }`}
          >
            策略逻辑
          </button>
          
          <button 
            onClick={() => setActiveTab('code')}
            className={`h-full flex items-center px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'code' 
                 ? `${theme.color} border-current ${isDarkTheme ? 'bg-white/5' : 'bg-white/50'}`
                : 'border-transparent text-gray-500 hover:text-gray-400'
            }`}
          >
            策略代码
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {code && activeTab === 'code' && (
            <button 
              onClick={handleDownload}
              className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 hover:opacity-80 transition-opacity ${
                 isDarkTheme ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              下载 .py
            </button>
          )}

          <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1.5 ${
            isDarkTheme 
              ? 'border-gray-600 text-gray-400 bg-gray-800' 
              : 'border-gray-200 text-gray-500 bg-white'
          }`}>
            {theme.icon}
            {strategyMode} 模式
          </span>
          <button 
            onClick={onToggleFullScreen}
            className={`hover:text-gray-900 transition-colors p-1 rounded ${isDarkTheme ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-white'}`}
            title={isFullScreen ? "退出全屏" : "全屏模式"}
          >
             {isFullScreen ? (
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10L4 15M9 15L4 10M15 10l5 5m0-5l-5 5" /></svg>
             ) : (
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
             )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Editor */}
        <div className={`flex-1 relative overflow-hidden group ${
          isDarkTheme ? 'bg-[#1e1e1e]' : 'bg-[#fbfbfb]'
        }`}>
          {isGenerating ? (
            <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-sm ${
              isDarkTheme ? 'bg-black/50 text-gray-300' : 'bg-white/50 text-gray-500'
            }`}>
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme.color.replace('text', 'border')}`}></div>
              <p className="mt-4 text-sm font-medium animate-pulse">AI 正在构建策略...</p>
            </div>
          ) : null}

          <div className="absolute inset-0 overflow-auto">
            {activeTab === 'logic' ? (
              <div className="p-6 max-w-none">
                {strategyLogic ? (
                  <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed border-none p-0 ${
                    isDarkTheme ? 'text-gray-300 bg-transparent' : 'text-gray-700 bg-transparent'
                  }`}>
                    {strategyLogic}
                  </pre>
                ) : (
                  <div className={`flex flex-col items-center justify-center h-64 ${isDarkTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                    <p>暂无策略逻辑摘要</p>
                    <p className="text-xs mt-2">请在下方对话框中点击“提炼策略逻辑”</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full w-full">
                  {code ? (
                    <SyntaxHighlighter
                      language="python"
                      style={isDarkTheme ? vscDarkPlus : oneLight}
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        height: '100%',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        backgroundColor: isDarkTheme ? '#1e1e1e' : '#fbfbfb',
                      }}
                      showLineNumbers={true}
                    >
                      {code}
                    </SyntaxHighlighter>
                  ) : (
                    <div className="p-4">
                      <pre className={`font-mono text-xs sm:text-sm leading-6 tab-4 ${
                        isDarkTheme ? 'text-[#d4d4d4]' : 'text-gray-800'
                      }`}>
                        <code>
                          # 暂无代码生成的。
                          # 请先生成策略摘要，然后点击“生成代码”。
                        </code>
                      </pre>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Tool Inspector (Context Aware) */}
        <div className={`w-56 border-l flex flex-col shrink-0 ${
          isDarkTheme ? 'border-[#3e3e42] bg-[#252526]' : 'border-mac-border/50 bg-white'
        }`}>
          <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b ${
            isDarkTheme ? 'text-gray-500 border-[#3e3e42]' : 'text-gray-400 border-gray-100'
          }`}>
             AI 辅助工具箱
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
             {theme.tools.map((tool, idx) => (
               <button
                 key={idx}
                 onClick={() => handleToolClick(tool)}
                 className={`w-full text-left px-3 py-2.5 rounded group relative overflow-hidden transition-all duration-200 ${
                   isDarkTheme 
                     ? 'hover:bg-[#37373d] text-gray-300 border border-transparent hover:border-gray-600' 
                     : `hover:bg-gray-50 text-gray-700 border border-gray-100 hover:border-blue-100 hover:shadow-sm`
                 }`}
               >
                 <div className="relative z-10">
                   <div className="flex items-center justify-between mb-0.5">
                     <span className="text-xs font-medium">{tool.label}</span>
                     {tool.params ? (
                        <svg className={`w-3 h-3 text-gray-400 group-hover:text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     ) : (
                        <svg className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${theme.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                     )}
                   </div>
                   {tool.desc && (
                     <div className={`text-[10px] leading-tight truncate ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                       {tool.desc}
                     </div>
                   )}
                 </div>
               </button>
             ))}
          </div>
          <div className={`p-3 text-[10px] border-t leading-tight flex flex-col gap-1 ${
            isDarkTheme ? 'text-gray-500 border-[#3e3e42]' : 'text-gray-400 border-gray-100'
          }`}>
            <span>带有 <span className="font-bold">⚙</span> 图标的工具支持自定义参数配置。</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDE;