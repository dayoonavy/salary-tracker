const { useState, useEffect, useRef } = React;

const INITIAL_DATA = {
    income: { base: 2538300, bonus1: 30000, food: 160000, teaching: 250000, teachingBonus: 200000, overtime: 127950, research: 75000 },
    tax: { incomeTax: 144330, localTax: 14430 },
    deduction: { pension: 336650, health: 131100, elderly: 17220, mutualAid: 720000 },
    fixedExpenses: [
        { id: 1, name: 'IRP', amount: 750000 },
        { id: 2, name: '주택청약', amount: 50000 },
        { id: 3, name: '오케스트라 회비', amount: 60000 },
        { id: 4, name: '급식비', amount: 120000 },
        { id: 5, name: '교사노조', amount: 25000 },
        { id: 6, name: '클라이밍', amount: 77000 },
        { id: 7, name: '피겨스케이팅', amount: 160000 }
    ],
    variableExpenses: [
        { id: 1, name: '생활비/식비', amount: 400000 },
        { id: 2, name: '여가/쇼핑', amount: 150000 }
    ],
    assets: { nh: 550000, salaryAccount: 8202392, kakao: 1159113, kb: 700000, housingSub: 6270000, mutualAidPrincipal: 9480000, lumpSum1: 25000000, lumpSum2: 27000000 },
    scenario: { adjMutualAid: 720000, adjIrp: 750000, newRent: 0, newYouthSaving: 0 }
};

const sumObj = (obj) => Object.values(obj).reduce((a, b) => a + Number(b), 0);
const sumArr = (arr) => arr.reduce((a, b) => a + Number(b.amount), 0);
const formatCurrency = (num) => new Intl.NumberFormat('ko-KR').format(Math.round(num)) + '원';

// 천단위 콤마가 자동으로 찍히고 맨 앞 0이 사라지는 Input 컴포넌트
function CurrencyInput({ value, onChange, placeholder, className }) {
    const [displayVal, setDisplayVal] = useState(value ? value.toLocaleString('ko-KR') : '');
    
    useEffect(() => {
        if (value === 0 && displayVal === '') return;
        setDisplayVal(value === 0 ? '' : value.toLocaleString('ko-KR'));
    }, [value]);

    const handleChange = (e) => {
        let raw = e.target.value.replace(/[^0-9]/g, '');
        if (raw === '') {
            setDisplayVal('');
            onChange(0);
            return;
        }
        let num = parseInt(raw, 10);
        setDisplayVal(num.toLocaleString('ko-KR'));
        onChange(num);
    };

    return (
        <input 
            type="text" 
            value={displayVal} 
            onChange={handleChange} 
            placeholder={placeholder || "0"} 
            className={className}
            inputMode="numeric"
        />
    );
}

function App() {
    const [tab, setTab] = useState('home');
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('salaryTrackerData');
        if (!saved) return INITIAL_DATA;
        let parsed = JSON.parse(saved);
        // 하위 호환성 및 마이그레이션 (fixedExpenses가 객체였던 시절 데이터면 배열로 변환)
        if (parsed.fixedExpenses && !Array.isArray(parsed.fixedExpenses)) {
            const arr = [];
            let i = 1;
            for (let k in parsed.fixedExpenses) {
                arr.push({ id: i++, name: k, amount: parsed.fixedExpenses[k] });
            }
            parsed.fixedExpenses = arr;
            parsed.variableExpenses = INITIAL_DATA.variableExpenses;
        }
        return { ...INITIAL_DATA, ...parsed, scenario: { ...INITIAL_DATA.scenario, ...(parsed.scenario||{}) } };
    });

    useEffect(() => {
        localStorage.setItem('salaryTrackerData', JSON.stringify(data));
    }, [data]);

    const totalIncome = sumObj(data.income);
    const totalTax = sumObj(data.tax);
    const totalDeduction = sumObj(data.deduction);
    const netIncome = totalIncome - totalTax - totalDeduction;
    const totalFixed = sumArr(data.fixedExpenses);
    const totalVariable = sumArr(data.variableExpenses);
    const pureNetIncome = netIncome - totalFixed - totalVariable; // 순수익
    
    const totalLiquidAssets = data.assets.nh + data.assets.salaryAccount + data.assets.kakao + data.assets.kb;
    const totalInvestment = data.assets.housingSub + data.assets.mutualAidPrincipal + data.assets.lumpSum1 + data.assets.lumpSum2;
    const totalAssets = totalLiquidAssets + totalInvestment;

    const renderTab = () => {
        switch(tab) {
            case 'home': return <HomeTab data={data} setData={setData} totalAssets={totalAssets} totalLiquidAssets={totalLiquidAssets} totalInvestment={totalInvestment} netIncome={netIncome} pureNetIncome={pureNetIncome} />;
            case 'salary': return <SalaryTab data={data} setData={setData} netIncome={netIncome} pureNetIncome={pureNetIncome} totalIncome={totalIncome} totalTax={totalTax} totalDeduction={totalDeduction} totalFixed={totalFixed} totalVariable={totalVariable} />;
            case 'simulation': return <SimulationTab data={data} setData={setData} />;
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

function HomeTab({ data, setData, totalAssets, totalLiquidAssets, totalInvestment, netIncome, pureNetIncome }) {
    const handleAddMutualAid = () => {
        const aidAmt = data.deduction.mutualAid;
        if(window.confirm(`이번 달 교직원 공제회비 ${formatCurrency(aidAmt)}을 장기저축 원금에 더할까요?`)) {
            setData(prev => ({
                ...prev,
                assets: {
                    ...prev.assets,
                    mutualAidPrincipal: prev.assets.mutualAidPrincipal + aidAmt
                }
            }));
            alert('반영되었습니다!');
        }
    };

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
                <div className="row">
                    <span>장기저축 원금</span>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <span>{formatCurrency(data.assets.mutualAidPrincipal)}</span>
                    </div>
                </div>
                <button className="add-btn" onClick={handleAddMutualAid}>+ 이번 달 공제회비 납입분 원금에 합산하기</button>
                <div className="row" style={{marginTop:'12px'}}><span>목돈예탁 1 (25년)</span><span>{formatCurrency(data.assets.lumpSum1)}</span></div>
                <div className="row"><span>목돈예탁 2 (26년)</span><span>{formatCurrency(data.assets.lumpSum2)}</span></div>
            </div>

            <div className="card">
                <div className="card-title">💵 이번 달 요약</div>
                <div className="row"><span>실수령액</span><span>{formatCurrency(netIncome)}</span></div>
                <div className="row"><span>총 지출 (고정+변동)</span><span>{formatCurrency(netIncome - pureNetIncome)}</span></div>
                <div className="row total"><span>🔥 순수익 (진짜 남는 돈)</span><span>{formatCurrency(pureNetIncome)}</span></div>
            </div>
        </div>
    );
}

function SalaryTab({ data, setData, netIncome, pureNetIncome, totalIncome, totalTax, totalDeduction, totalFixed, totalVariable }) {
    const handleUpdate = (category, key, value) => {
        setData(prev => ({ ...prev, [category]: { ...prev[category], [key]: value } }));
    };

    const handleArrUpdate = (category, id, field, value) => {
        setData(prev => ({
            ...prev,
            [category]: prev[category].map(item => item.id === id ? { ...item, [field]: value } : item)
        }));
    };

    const addExpense = (category) => {
        setData(prev => ({
            ...prev,
            [category]: [...prev[category], { id: Date.now(), name: '', amount: 0 }]
        }));
    };

    const removeExpense = (category, id) => {
        setData(prev => ({
            ...prev,
            [category]: prev[category].filter(item => item.id !== id)
        }));
    };

    return (
        <div>
            {/* 1. 최종 결과 */}
            <div className="card" style={{ background: 'var(--primary)', color: 'white' }}>
                <div className="card-title" style={{ color: 'white' }}>✨ 최종 결과</div>
                <div className="row" style={{ color: 'white' }}><span>실수령액</span><span style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatCurrency(netIncome)}</span></div>
                <div className="row" style={{ color: 'white' }}><span>순수익 (고정/변동 차감 후)</span><span style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatCurrency(pureNetIncome)}</span></div>
            </div>

            {/* 2. 변동 지출 */}
            <div className="card">
                <div className="card-title" style={{justifyContent: 'space-between'}}>
                    <span>💳 변동 지출</span>
                    <span style={{color: 'var(--primary)'}}>{formatCurrency(totalVariable)}</span>
                </div>
                {data.variableExpenses.map(exp => (
                    <div className="expense-item" key={exp.id}>
                        <input type="text" className="name-input" value={exp.name} onChange={(e) => handleArrUpdate('variableExpenses', exp.id, 'name', e.target.value)} placeholder="지출명" />
                        <CurrencyInput className="amount-input" value={exp.amount} onChange={(v) => handleArrUpdate('variableExpenses', exp.id, 'amount', v)} />
                        <button className="delete-btn" onClick={() => removeExpense('variableExpenses', exp.id)}>X</button>
                    </div>
                ))}
                <button className="add-btn" onClick={() => addExpense('variableExpenses')}>+ 항목 추가</button>
            </div>

            {/* 3. 고정 지출 */}
            <div className="card">
                <div className="card-title" style={{justifyContent: 'space-between'}}>
                    <span>📅 고정 지출</span>
                    <span style={{color: 'var(--primary)'}}>{formatCurrency(totalFixed)}</span>
                </div>
                {data.fixedExpenses.map(exp => (
                    <div className="expense-item" key={exp.id}>
                        <input type="text" className="name-input" value={exp.name} onChange={(e) => handleArrUpdate('fixedExpenses', exp.id, 'name', e.target.value)} placeholder="지출명" />
                        <CurrencyInput className="amount-input" value={exp.amount} onChange={(v) => handleArrUpdate('fixedExpenses', exp.id, 'amount', v)} />
                        <button className="delete-btn" onClick={() => removeExpense('fixedExpenses', exp.id)}>X</button>
                    </div>
                ))}
                <button className="add-btn" onClick={() => addExpense('fixedExpenses')}>+ 항목 추가</button>
            </div>

            {/* 4. 수입 */}
            <div className="card">
                <div className="card-title">💸 수입 내역 ({formatCurrency(totalIncome)})</div>
                <div className="grid-2-col">
                    {Object.entries({ base: '본봉', bonus1: '정근가산금', food: '급식비', teaching: '교직수당', teachingBonus: '교직수당 가산', overtime: '시간외수당', research: '교원연구비' }).map(([key, label]) => (
                        <div className="input-group" key={key} style={{marginBottom: 0}}>
                            <label>{label}</label>
                            <CurrencyInput value={data.income[key]} onChange={(v) => handleUpdate('income', key, v)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. 세금 및 공제 */}
            <div className="card">
                <div className="card-title">🧾 세금 및 공제 ({formatCurrency(totalTax + totalDeduction)})</div>
                <div className="section-label" style={{marginTop:0}}>세금 ({formatCurrency(totalTax)})</div>
                <div className="grid-2-col">
                    <div className="input-group" style={{marginBottom: 0}}><label>소득세</label><CurrencyInput value={data.tax.incomeTax} onChange={(v) => handleUpdate('tax', 'incomeTax', v)} /></div>
                    <div className="input-group" style={{marginBottom: 0}}><label>지방소득세</label><CurrencyInput value={data.tax.localTax} onChange={(v) => handleUpdate('tax', 'localTax', v)} /></div>
                </div>
                
                <div className="section-label">공제액 ({formatCurrency(totalDeduction)})</div>
                <div className="grid-2-col">
                    <div className="input-group" style={{marginBottom: 0}}><label>일반기여금</label><CurrencyInput value={data.deduction.pension} onChange={(v) => handleUpdate('deduction', 'pension', v)} /></div>
                    <div className="input-group" style={{marginBottom: 0}}><label>건강보험</label><CurrencyInput value={data.deduction.health} onChange={(v) => handleUpdate('deduction', 'health', v)} /></div>
                    <div className="input-group" style={{marginBottom: 0}}><label>노인장기요양</label><CurrencyInput value={data.deduction.elderly} onChange={(v) => handleUpdate('deduction', 'elderly', v)} /></div>
                    <div className="input-group" style={{marginBottom: 0}}><label>교직원 공제회</label><CurrencyInput value={data.deduction.mutualAid} onChange={(v) => handleUpdate('deduction', 'mutualAid', v)} /></div>
                </div>
            </div>
        </div>
    );
}

function SimulationTab({ data, setData }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    const s = data.scenario || { adjMutualAid: 720000, adjIrp: 750000, newRent: 0, newYouthSaving: 0 };
    const [targetYear, setTargetYear] = useState(10); // N년 후 수령액 차이
    const [lumpSumYear, setLumpSumYear] = useState(5); // 목돈 예탁 N년 후

    const handleUpdate = (key, value) => {
        setData(prev => ({ ...prev, scenario: { ...prev.scenario, [key]: value } }));
    };

    // IRP
    const IRP_RATE = 0.165;
    const currentIrpAmount = data.fixedExpenses.find(e => e.name === 'IRP' || e.name.toLowerCase() === 'irp')?.amount || 0;
    const currIrpAnnual = Math.min(currentIrpAmount * 12, 9000000);
    const currRefund = currIrpAnnual * IRP_RATE;
    const adjIrpAnnual = Math.min(s.adjIrp * 12, 9000000);
    const adjRefund = adjIrpAnnual * IRP_RATE;

    // Mutual Aid
    const MutualAidRate = 0.05; 
    const calcFutureValue = (principal, monthlyPmt, years, rate) => {
        let fv = principal;
        for(let i = 0; i < years * 12; i++) {
            fv += monthlyPmt;
            fv += fv * (rate / 12);
        }
        return fv;
    };

    const currentMutualAidPrinciple = data.assets.mutualAidPrincipal;
    
    // Line Chart Data (1 to 25 years)
    const yearsToSimulate = Array.from({length: 25}, (_, i) => i + 1);
    const currPlanData = yearsToSimulate.map(y => calcFutureValue(currentMutualAidPrinciple, data.deduction.mutualAid, y, MutualAidRate));
    const adjPlanData = yearsToSimulate.map(y => calcFutureValue(currentMutualAidPrinciple, s.adjMutualAid, y, MutualAidRate));

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: yearsToSimulate.map(y => `${y}년`),
                datasets: [
                    {
                        label: '현재 계획 (월 ' + (data.deduction.mutualAid/10000) + '만)',
                        data: currPlanData,
                        borderColor: '#B5E0FF',
                        backgroundColor: 'rgba(181, 224, 255, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: '조정 계획 (월 ' + (s.adjMutualAid/10000) + '만)',
                        data: adjPlanData,
                        borderColor: '#B39DDB', /* 연보라색 */
                        backgroundColor: 'rgba(179, 157, 219, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: (val) => (val / 100000000).toFixed(1) + '억' }
                    }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }, [data.deduction.mutualAid, s.adjMutualAid]);

    // 현금 흐름 차이 = 기존 (장기저축+IRP) - 조정 (장기저축+IRP+자취+청년적금)
    const cashFlowDiff = (data.deduction.mutualAid + currentIrpAmount) - (s.adjMutualAid + s.adjIrp + s.newRent + s.newYouthSaving);

    // 목돈 예탁 계산
    const lumpSumTotal = data.assets.lumpSum1 + data.assets.lumpSum2;
    const lumpSumRate = 0.0321; // 3.21% 연복리
    const lumpSumFuture = lumpSumTotal * Math.pow(1 + lumpSumRate, lumpSumYear);

    // Target Year Difference
    const targetCurrFV = calcFutureValue(currentMutualAidPrinciple, data.deduction.mutualAid, targetYear, MutualAidRate);
    const targetAdjFV = calcFutureValue(currentMutualAidPrinciple, s.adjMutualAid, targetYear, MutualAidRate);

    return (
        <div>
            {/* 목돈 예탁 시뮬레이션 */}
            <div className="card">
                <div className="card-title">💰 목돈 예탁 굴리기</div>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>현재 예탁된 {formatCurrency(lumpSumTotal)}이 세후 3.21% 연복리로 얼마나 불어나는지 확인하세요.</p>
                <div className="input-group">
                    <label>몇 년 뒤에 찾으실 계획인가요? (년)</label>
                    <input type="number" value={lumpSumYear} onChange={(e) => setLumpSumYear(Number(e.target.value) || 0)} />
                </div>
                <div className="row total" style={{ fontSize: '16px' }}>
                    <span>{lumpSumYear}년 후 수령 예상액</span>
                    <span style={{ color: 'var(--primary)' }}>{formatCurrency(lumpSumFuture)}</span>
                </div>
                <div className="row" style={{ marginTop: '8px', fontSize: '14px', color: '#888' }}>
                    <span>순수 이자 수익</span>
                    <span>+{formatCurrency(lumpSumFuture - lumpSumTotal)}</span>
                </div>
            </div>

            <div className="card">
                <div className="card-title">💡 자취 및 예산 조정 시뮬레이터</div>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>장기저축과 IRP를 줄이고 자취/적금을 시작할 때의 변화입니다.</p>
                
                <div className="grid-2-col">
                    <div className="input-group" style={{marginBottom: 0}}>
                        <label>장기저축급여 변경</label>
                        <CurrencyInput value={s.adjMutualAid} onChange={(v) => handleUpdate('adjMutualAid', v)} />
                    </div>
                    <div className="input-group" style={{marginBottom: 0}}>
                        <label>IRP 변경</label>
                        <CurrencyInput value={s.adjIrp} onChange={(v) => handleUpdate('adjIrp', v)} />
                    </div>
                    <div className="input-group" style={{marginBottom: 0}}>
                        <label>새로운 월세/관리비</label>
                        <CurrencyInput value={s.newRent} onChange={(v) => handleUpdate('newRent', v)} />
                    </div>
                    <div className="input-group" style={{marginBottom: 0}}>
                        <label>새로운 청년적금</label>
                        <CurrencyInput value={s.newYouthSaving} onChange={(v) => handleUpdate('newYouthSaving', v)} />
                    </div>
                </div>

                <div className="row total" style={{ fontSize: '15px', marginTop: '20px' }}>
                    <span>매월 가용 현금 변화</span>
                    <span style={{ color: cashFlowDiff >= 0 ? '#4CAF50' : '#F44336' }}>
                        {cashFlowDiff > 0 ? '+' : ''}{formatCurrency(cashFlowDiff)}
                    </span>
                </div>
            </div>

            <div className="card">
                <div className="card-title">🧾 IRP 연말정산 손실 비교</div>
                <div className="row"><span>현재 계획 (연 16.5%)</span><strong>{formatCurrency(currRefund)}</strong></div>
                <div className="row"><span>조정 계획 (연 16.5%)</span><strong>{formatCurrency(adjRefund)}</strong></div>
                <div className="row total">
                    <span>세액공제 손실액</span>
                    <span style={{ color: '#F44336' }}>{formatCurrency(currRefund - adjRefund)}</span>
                </div>
            </div>

            <div className="card">
                <div className="card-title">📈 장기저축급여 스노우볼 차이</div>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>* 가로로 스크롤하여 25년 후까지 볼 수 있습니다.</p>
                <div className="chart-scroll-wrapper">
                    <div className="chart-container-large">
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>
                
                <div style={{ marginTop: '20px', background: '#f9f9f9', padding: '16px', borderRadius: '12px' }}>
                    <div className="input-group" style={{flexDirection: 'row', alignItems: 'center', marginBottom: '12px'}}>
                        <label style={{margin: 0, fontSize: '16px', color: '#333'}}>몇 년 후 수령액 차이?</label>
                        <input type="number" style={{width: '60px', padding: '8px', marginLeft: 'auto'}} value={targetYear} onChange={(e) => setTargetYear(Number(e.target.value) || 0)} />
                        <span style={{fontWeight: 'bold'}}>년</span>
                    </div>
                    
                    <div className="row"><span>현재 계획 유지 시</span><span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{formatCurrency(targetCurrFV)}</span></div>
                    <div className="row"><span>조정 계획 적용 시</span><span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{formatCurrency(targetAdjFV)}</span></div>
                    <div className="row total" style={{marginTop: '12px', paddingTop: '12px'}}>
                        <span>{targetYear}년 후 수령액 차이</span>
                        <span style={{ color: '#F44336' }}>{formatCurrency(targetCurrFV - targetAdjFV)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
