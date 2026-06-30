const { useState, useEffect, useRef } = React;

const INITIAL_DATA = {
    income: { base: 2538300, bonus1: 30000, food: 160000, teaching: 250000, teachingBonus: 200000, overtime: 127950, research: 75000 },
    tax: { incomeTax: 144330, localTax: 14430 },
    deduction: { pension: 336650, health: 131100, elderly: 17220, mutualAid: 720000 },
    fixedExpenses: { irp: 750000, housing: 50000, orchestra: 60000, food: 120000, union: 25000, climbing: 77000, skating: 160000 },
    assets: { nh: 550000, salaryAccount: 8202392, kakao: 1159113, kb: 700000, housingSub: 6270000, mutualAidPrincipal: 9480000, lumpSum1: 25000000, lumpSum2: 27000000 },
    irpTotalIncome: 44438430,
    scenario: { adjMutualAid: 720000, adjIrp: 750000, newRent: 0, newYouthSaving: 0 }
};

const sumObj = (obj) => Object.values(obj).reduce((a, b) => a + Number(b), 0);
const formatCurrency = (num) => new Intl.NumberFormat('ko-KR').format(Math.round(num)) + '원';

function App() {
    const [tab, setTab] = useState('home');
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('salaryTrackerData');
        // Merge saved data with INITIAL_DATA to ensure new fields (like scenario) exist
        return saved ? { ...INITIAL_DATA, ...JSON.parse(saved) } : INITIAL_DATA;
    });

    useEffect(() => {
        localStorage.setItem('salaryTrackerData', JSON.stringify(data));
    }, [data]);

    const totalIncome = sumObj(data.income);
    const totalTax = sumObj(data.tax);
    const totalDeduction = sumObj(data.deduction);
    const netIncome = totalIncome - totalTax - totalDeduction;
    const totalFixed = sumObj(data.fixedExpenses);
    const remainingCash = netIncome - totalFixed;
    
    const totalLiquidAssets = data.assets.nh + data.assets.salaryAccount + data.assets.kakao + data.assets.kb;
    const totalInvestment = data.assets.housingSub + data.assets.mutualAidPrincipal + data.assets.lumpSum1 + data.assets.lumpSum2;
    const totalAssets = totalLiquidAssets + totalInvestment;

    const renderTab = () => {
        switch(tab) {
            case 'home': return <HomeTab data={data} totalAssets={totalAssets} totalLiquidAssets={totalLiquidAssets} totalInvestment={totalInvestment} netIncome={netIncome} remainingCash={remainingCash} />;
            case 'salary': return <SalaryTab data={data} setData={setData} netIncome={netIncome} totalIncome={totalIncome} totalTax={totalTax} totalDeduction={totalDeduction} totalFixed={totalFixed} remainingCash={remainingCash} />;
            case 'simulation': return <SimulationTab data={data} setData={setData} remainingCash={remainingCash} />;
            default: return <HomeTab />;
        }
    };

    return (
        <div className="app-container">
            <div className="header">
                <h1>{tab === 'home' ? '💎 내 자산 현황' : tab === 'salary' ? '🧾 월급 및 지출 관리' : '📈 미래 시나리오 분석'}</h1>
            </div>
            
            {renderTab()}

            <div className="nav-bar">
                <div className={`nav-item ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
                    <span className="nav-icon">🏠</span><span>홈</span>
                </div>
                <div className={`nav-item ${tab === 'salary' ? 'active' : ''}`} onClick={() => setTab('salary')}>
                    <span className="nav-icon">🧾</span><span>명세서</span>
                </div>
                <div className={`nav-item ${tab === 'simulation' ? 'active' : ''}`} onClick={() => setTab('simulation')}>
                    <span className="nav-icon">📈</span><span>시나리오</span>
                </div>
            </div>
        </div>
    );
}

function HomeTab({ data, totalAssets, totalLiquidAssets, totalInvestment, netIncome, remainingCash }) {
    return (
        <div>
            <div className="card">
                <div className="card-title">💎 총 보유 자산</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)', marginBottom: '16px' }}>
                    {formatCurrency(totalAssets)}
                </div>
                <div className="row">
                    <span>💳 바로 쓸 수 있는 돈 (유동자산)</span>
                    <strong>{formatCurrency(totalLiquidAssets)}</strong>
                </div>
                <div className="row">
                    <span>🌱 모으고 있는 돈 (저축/예탁)</span>
                    <strong>{formatCurrency(totalInvestment)}</strong>
                </div>
            </div>

            <div className="card">
                <div className="card-title">🏦 내 통장 쪼개기</div>
                <div className="section-label">유동 자산</div>
                <div className="row"><span>월급통장</span><span>{formatCurrency(data.assets.salaryAccount)}</span></div>
                <div className="row"><span>농협 비상금</span><span>{formatCurrency(data.assets.nh)}</span></div>
                <div className="row"><span>카카오페이 비상금</span><span>{formatCurrency(data.assets.kakao)}</span></div>
                <div className="row"><span>KB 통장</span><span>{formatCurrency(data.assets.kb)}</span></div>
                <div className="section-label">저축 / 투자 자산</div>
                <div className="row"><span>주택청약</span><span>{formatCurrency(data.assets.housingSub)}</span></div>
                <div className="row"><span>장기저축 원금</span><span>{formatCurrency(data.assets.mutualAidPrincipal)}</span></div>
                <div className="row"><span>목돈예탁 1 (25년)</span><span>{formatCurrency(data.assets.lumpSum1)}</span></div>
                <div className="row"><span>목돈예탁 2 (26년)</span><span>{formatCurrency(data.assets.lumpSum2)}</span></div>
            </div>

            <div className="card">
                <div className="card-title">💵 이번 달 요약</div>
                <div className="row"><span>실수령액</span><span>{formatCurrency(netIncome)}</span></div>
                <div className="row"><span>고정 지출</span><span>{formatCurrency(netIncome - remainingCash)}</span></div>
                <div className="row total"><span>🔥 순수 저축 여력</span><span>{formatCurrency(remainingCash)}</span></div>
            </div>
        </div>
    );
}

function SalaryTab({ data, setData, netIncome, totalIncome, totalTax, totalDeduction, totalFixed, remainingCash }) {
    const handleUpdate = (category, key, value) => {
        setData(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: Number(value) || 0
            }
        }));
    };

    return (
        <div>
            <div className="card">
                <div className="card-title">💸 이번 달 수입 ({formatCurrency(totalIncome)})</div>
                {Object.entries({ base: '본봉', bonus1: '정근수당가산금', food: '정액급식비', teaching: '교직수당', teachingBonus: '교직수당 가산금', overtime: '시간외 근무수당', research: '교원연구비' }).map(([key, label]) => (
                    <div className="input-group" key={key}>
                        <label>{label}</label>
                        <input type="number" value={data.income[key]} onChange={(e) => handleUpdate('income', key, e.target.value)} />
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-title">🧾 세금 및 공제 ({formatCurrency(totalTax + totalDeduction)})</div>
                <div className="section-label">세금 ({formatCurrency(totalTax)})</div>
                <div className="input-group"><label>소득세</label><input type="number" value={data.tax.incomeTax} onChange={(e) => handleUpdate('tax', 'incomeTax', e.target.value)} /></div>
                <div className="input-group"><label>지방소득세</label><input type="number" value={data.tax.localTax} onChange={(e) => handleUpdate('tax', 'localTax', e.target.value)} /></div>
                
                <div className="section-label">공제액 ({formatCurrency(totalDeduction)})</div>
                <div className="input-group"><label>일반기여금</label><input type="number" value={data.deduction.pension} onChange={(e) => handleUpdate('deduction', 'pension', e.target.value)} /></div>
                <div className="input-group"><label>건강보험</label><input type="number" value={data.deduction.health} onChange={(e) => handleUpdate('deduction', 'health', e.target.value)} /></div>
                <div className="input-group"><label>노인장기요양보험</label><input type="number" value={data.deduction.elderly} onChange={(e) => handleUpdate('deduction', 'elderly', e.target.value)} /></div>
                <div className="input-group"><label>교직원 공제회비</label><input type="number" value={data.deduction.mutualAid} onChange={(e) => handleUpdate('deduction', 'mutualAid', e.target.value)} /></div>
            </div>

            <div className="card">
                <div className="card-title">💳 고정 지출 ({formatCurrency(totalFixed)})</div>
                {Object.entries({ irp: 'IRP', housing: '주택청약', orchestra: '오케스트라 회비', food: '급식비', union: '교사노조', climbing: '클라이밍', skating: '피겨스케이팅' }).map(([key, label]) => (
                    <div className="input-group" key={key}>
                        <label>{label}</label>
                        <input type="number" value={data.fixedExpenses[key]} onChange={(e) => handleUpdate('fixedExpenses', key, e.target.value)} />
                    </div>
                ))}
            </div>

            <div className="card" style={{ background: 'var(--primary)', color: 'white' }}>
                <div className="card-title" style={{ color: 'white' }}>✨ 최종 결과</div>
                <div className="row" style={{ color: 'white' }}><span>실수령액</span><span style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatCurrency(netIncome)}</span></div>
                <div className="row" style={{ color: 'white' }}><span>고정 지출 후 남는 돈</span><span style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatCurrency(remainingCash)}</span></div>
            </div>
        </div>
    );
}

function SimulationTab({ data, setData, remainingCash }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    const s = data.scenario || { adjMutualAid: 720000, adjIrp: 750000, newRent: 0, newYouthSaving: 0 };

    const handleUpdate = (key, value) => {
        setData(prev => ({
            ...prev,
            scenario: { ...prev.scenario, [key]: Number(value) || 0 }
        }));
    };

    // Calculate IRP Refund
    const IRP_RATE = 0.165; // Total income < 55M
    const currIrpAnnual = Math.min(data.fixedExpenses.irp * 12, 9000000);
    const currRefund = currIrpAnnual * IRP_RATE;
    const adjIrpAnnual = Math.min(s.adjIrp * 12, 9000000);
    const adjRefund = adjIrpAnnual * IRP_RATE;

    // Calculate Mutual Aid Compound Interest (Approximate Yearly)
    const MutualAidRate = 0.05; // 5% 연복리
    const calcFutureValue = (principal, monthlyPmt, years, rate) => {
        let fv = principal;
        for(let i = 0; i < years * 12; i++) {
            fv += monthlyPmt;
            fv += fv * (rate / 12); // monthly compounding approx for mutual aid
        }
        return fv;
    };

    const currentMutualAidPrinciple = data.assets.mutualAidPrincipal;
    
    // Scenarios for 5, 10, 20 years
    const yearsToSimulate = [1, 3, 5, 10];
    const currPlanData = yearsToSimulate.map(y => calcFutureValue(currentMutualAidPrinciple, data.deduction.mutualAid, y, MutualAidRate));
    const adjPlanData = yearsToSimulate.map(y => calcFutureValue(currentMutualAidPrinciple, s.adjMutualAid, y, MutualAidRate));

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: yearsToSimulate.map(y => `${y}년 후`),
                datasets: [
                    {
                        label: '현재 계획 (월 ' + (data.deduction.mutualAid/10000) + '만)',
                        data: currPlanData,
                        backgroundColor: '#B5E0FF',
                        borderRadius: 4
                    },
                    {
                        label: '조정 계획 (월 ' + (s.adjMutualAid/10000) + '만)',
                        data: adjPlanData,
                        backgroundColor: '#FFB5B5',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (val) => (val / 100000000).toFixed(1) + '억'
                        }
                    }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }, [data.deduction.mutualAid, s.adjMutualAid]);

    const cashFlowDiff = (data.deduction.mutualAid + data.fixedExpenses.irp) - (s.adjMutualAid + s.adjIrp + s.newRent + s.newYouthSaving);

    return (
        <div>
            <div className="card">
                <div className="card-title">💡 하반기 자취 및 예산 조정 시뮬레이터</div>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>자취와 청년적금을 시작하며 장기저축과 IRP를 줄였을 때의 변화를 확인하세요.</p>
                
                <div className="section-label">조정할 납입액 입력</div>
                <div className="input-group">
                    <label>장기저축급여 (현재: {formatCurrency(data.deduction.mutualAid)})</label>
                    <input type="number" value={s.adjMutualAid} onChange={(e) => handleUpdate('adjMutualAid', e.target.value)} />
                </div>
                <div className="input-group">
                    <label>IRP (현재: {formatCurrency(data.fixedExpenses.irp)})</label>
                    <input type="number" value={s.adjIrp} onChange={(e) => handleUpdate('adjIrp', e.target.value)} />
                </div>
                
                <div className="section-label">새로 생기는 지출</div>
                <div className="input-group">
                    <label>예상 월세/관리비 (자취)</label>
                    <input type="number" value={s.newRent} onChange={(e) => handleUpdate('newRent', e.target.value)} />
                </div>
                <div className="input-group">
                    <label>청년미래적금</label>
                    <input type="number" value={s.newYouthSaving} onChange={(e) => handleUpdate('newYouthSaving', e.target.value)} />
                </div>

                <div className="row total" style={{ fontSize: '15px' }}>
                    <span>매월 가용 현금 변화</span>
                    <span style={{ color: cashFlowDiff >= 0 ? '#4CAF50' : '#F44336' }}>
                        {cashFlowDiff > 0 ? '+' : ''}{formatCurrency(cashFlowDiff)}
                    </span>
                </div>
            </div>

            <div className="card">
                <div className="card-title">🧾 IRP 연말정산 세액공제 비교</div>
                <div className="row"><span>현재 계획 시 (연 16.5%)</span><strong>{formatCurrency(currRefund)}</strong></div>
                <div className="row"><span>조정 계획 시 (연 16.5%)</span><strong>{formatCurrency(adjRefund)}</strong></div>
                <div className="row total">
                    <span>세액공제 손실액</span>
                    <span>{formatCurrency(currRefund - adjRefund)}</span>
                </div>
            </div>

            <div className="card">
                <div className="card-title">📈 장기저축급여 복리 스노우볼 차이</div>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>* 연복리 5.0% 가정, 원금 {formatCurrency(currentMutualAidPrinciple)} 기반 계산</p>
                <div className="chart-container">
                    <canvas ref={chartRef}></canvas>
                </div>
                <div style={{ marginTop: '20px', fontSize: '14px', background: '#f9f9f9', padding: '12px', borderRadius: '12px' }}>
                    <strong>💡 10년 후 예상 수령액 차이:</strong><br/>
                    현재 계획 유지 시: <span style={{ color: 'var(--secondary)' }}>{formatCurrency(currPlanData[3])}</span><br/>
                    조정 계획 적용 시: <span style={{ color: 'var(--primary)' }}>{formatCurrency(adjPlanData[3])}</span><br/>
                    <strong style={{ color: '#F44336' }}>차액: {formatCurrency(currPlanData[3] - adjPlanData[3])}</strong>
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
