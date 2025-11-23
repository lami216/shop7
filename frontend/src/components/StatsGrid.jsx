import { formatNumber } from "../utils/numberFormat";

const StatCard = ({ label, value, description }) => (
        <div className='rounded-2xl bg-white p-4 text-right shadow card-shadow border border-ajv-mint/60'>
                <p className='text-sm text-ajv-moss/70'>{label}</p>
                <p className='mt-1 text-2xl font-bold text-ajv-moss'>{value}</p>
                {description && <p className='mt-1 text-xs text-ajv-moss/70'>{description}</p>}
        </div>
);

const StatsGrid = ({ stats }) => {
        return (
                <section className='mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                        <StatCard label='إجمالي التبرعات' value={`${formatNumber(stats.totalDonations || 0)} MRU`} />
                        <StatCard label='عدد عمليات التبرع' value={formatNumber(stats.donationCount || 0)} />
                        <StatCard label='عدد المتبرعين' value={formatNumber(stats.donorsCount || 0)} description='عدد المتبرعين المميزين' />
                        <StatCard
                                label='المشاريع المكتملة'
                                value={`${formatNumber(stats.completedProjects || 0)} / ${formatNumber(stats.totalProjects || 0)}`}
                                description='يعتبر المشروع مكتمل التمويل عند تجاوز الهدف'
                        />
                </section>
        );
};

export default StatsGrid;
