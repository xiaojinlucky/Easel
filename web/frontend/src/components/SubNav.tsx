import type { Page } from './Sidebar';
import type { ComponentType } from 'react';
import { IconDashboard, IconFire, IconIdea, IconCalendar, IconPublish, IconSkills } from './icons';

interface SubNavTab {
  page: Page;
  Icon: ComponentType<{ size?: number }>;
  label: string;
}

interface SubNavProps {
  current: Page;
  onNavigate: (page: Page) => void;
  /** 返回目标，默认回工作台 */
  backTo?: Page;
  /** 返回按钮文案，默认「工作台」 */
  backLabel?: string;
  /** 组内页签，默认「工作台」工具组 */
  tabs?: SubNavTab[];
}

const TOOLS: SubNavTab[] = [
  { page: 'trends', Icon: IconFire, label: '热点雷达' },
  { page: 'ideas', Icon: IconIdea, label: '选题库' },
  { page: 'calendar', Icon: IconCalendar, label: '内容日历' },
  { page: 'publish', Icon: IconPublish, label: '发布中心' },
  { page: 'breakdown', Icon: IconSkills, label: '爆款拆解' },
];

export default function SubNav({
  current,
  onNavigate,
  backTo = 'dashboard',
  backLabel = '工作台',
  tabs = TOOLS,
}: SubNavProps) {
  return (
    <div className="subnav">
      <button className="subnav-back" onClick={() => onNavigate(backTo)} title={`返回${backLabel}`}>
        <IconDashboard size={15} /> {backLabel}
      </button>
      <span className="subnav-div" />
      <div className="subnav-tabs">
        {tabs.map(({ page, Icon, label }) => (
          <button key={page} className={`subnav-tab ${current === page ? 'active' : ''}`}
            onClick={() => onNavigate(page)}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>
    </div>
  );
}
