export enum Platform {
  MYQUANT = '掘金量化 (MyQuant)',
  JOINQUANT = '聚宽 (JoinQuant)',
  TUSHARE = 'Tushare Pro',
}

export enum RunMode {
  BACKTEST = '历史回测 (Backtest)',
  SIMULATION = '模拟交易 (Simulation)',
  LIVE = '实盘交易 (Live)',
}

export enum StrategyMode {
  TRADITIONAL = '传统金融 (Traditional)',
  STATISTICAL = '统计套利 (Statistical)',
  ML = '机器学习 (Machine Learning)',
  DL = '深度学习 (Deep Learning)',
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface AppConfig {
  platform: Platform;
  runMode: RunMode;
  strategyMode: StrategyMode;
  capital: number;
  startDate: string;
  endDate: string;
  frequency: '1m' | '5m' | '1d';
}

export interface StrategySession {
  id: string;
  name: string;
  messages: Message[];
  strategyLogic: string;
  generatedCode: string;
  lastModified: number;
}
