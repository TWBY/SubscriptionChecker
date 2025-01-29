let tl; // 宣告在全域範圍

document.addEventListener('DOMContentLoaded', function() {
    // 設定當前日期為 2025 年 1 月
    let currentDate = new Date(2025, 0, 1); // 0 代表 1 月
    let subscriptions = [];
    
    // 添加讀取和儲存功能
    function loadSubscriptions() {
        try {
            const data = localStorage.getItem('subscriptions');
            if (data) {
                subscriptions = JSON.parse(data);
            }
            // 無論是否有資料都更新日曆和訂閱列表
            updateCalendar();
            updateSubscriptionList();
        } catch (error) {
            console.error('Error loading subscriptions:', error);
            // 發生錯誤時也要更新日曆
            updateCalendar();
            updateSubscriptionList();
        }
    }

    function saveSubscriptions() {
        try {
            localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        } catch (error) {
            console.error('Error saving subscriptions:', error);
        }
    }
    
    function updateCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // 將月份加 1，因為月份從 0 開始
        
        // 更新標題
        document.querySelector('.title').textContent = `${year} 年 ${month} 月`; // 更新為 "2025 年 1 月"
        
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        
        const firstDay = new Date(year, month - 1, 1); // 月份需要減 1
        const lastDay = new Date(year, month, 0);
        
        const startDay = firstDay.getDay();
        const totalDays = lastDay.getDate();
        
        // 上個月的最後幾天
        const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const dayDiv = createDayElement(prevMonthLastDay - i, true, year, month - 1);
            grid.appendChild(dayDiv);
        }
        
        // 當前月份的天數
        for (let i = 1; i <= totalDays; i++) {
            const dayDiv = createDayElement(i, false, year, month);
            if (isToday(year, month, i)) {
                dayDiv.classList.add('today');
            }
            grid.appendChild(dayDiv);
        }
        
        // 下個月的開始幾天
        const remainingDays = 42 - (startDay + totalDays);
        for (let i = 1; i <= remainingDays; i++) {
            const dayDiv = createDayElement(i, true, year, month + 1);
            grid.appendChild(dayDiv);
        }
    }
    
    // 創建日期元素
    function createDayElement(day, isOtherMonth, year, month) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day' + (isOtherMonth ? ' other-month' : '');
        
        // 創建內容容器
        const contentDiv = document.createElement('div');
        contentDiv.className = 'calendar-day-content';
        
        // 添加日期數字
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        contentDiv.appendChild(dayNumber);
        
        dayDiv.appendChild(contentDiv);
        
        // 存儲該日期的所有訂閱
        const daySubscriptions = [];
        
        // 檢查該日期是否有訂閱
        subscriptions.forEach(subscription => {
            if (subscription.cycle === 'monthly') {
                if (parseInt(subscription.paymentDate) === day && !isOtherMonth) {
                    addSubscriptionToDay(contentDiv, subscription);
                    daySubscriptions.push(subscription);
                }
            } else {
                const [subMonth, subDay] = subscription.paymentDate.split('/');
                if (parseInt(subMonth) === month && parseInt(subDay) === day && !isOtherMonth) {
                    addSubscriptionToDay(contentDiv, subscription);
                    daySubscriptions.push(subscription);
                }
            }
        });
        
        // 添加滑鼠事件
        if (daySubscriptions.length > 0) {
            dayDiv.addEventListener('mouseenter', (e) => showTooltip(e, daySubscriptions, day));
            dayDiv.addEventListener('mouseleave', hideTooltip);
        }
        
        return dayDiv;
    }
    
    function addSubscriptionToDay(dayDiv, subscription) {
        const subscriptionCount = dayDiv.querySelectorAll('.subscription-label, .subscription-dot').length;
        
        // 如果已有兩個訂閱標籤，後續使用點狀顯示
        if (subscriptionCount >= 2) {
            // 檢查是否已經有點狀容器
            let dotsContainer = dayDiv.querySelector('.subscription-dots');
            if (!dotsContainer) {
                dotsContainer = document.createElement('div');
                dotsContainer.className = 'subscription-dots';
                dayDiv.appendChild(dotsContainer);
            }
            
            const dot = document.createElement('div');
            dot.className = 'subscription-dot';
            dot.title = subscription.name; // 添加提示文字
            dotsContainer.appendChild(dot);
        } else {
            // 使用標籤顯示（前兩個訂閱）
            const subscriptionDiv = document.createElement('div');
            subscriptionDiv.className = 'subscription-label';
            subscriptionDiv.textContent = subscription.name;
            dayDiv.appendChild(subscriptionDiv);
        }
    }
    
    // 檢查是否為今天
    function isToday(year, month, day) {
        const today = new Date();
        return today.getFullYear() === year &&
               today.getMonth() + 1 === month &&
               today.getDate() === day;
    }
    
    // 初始化所有下拉選單
    initializeDropdowns();
    
    // 初始化下拉選單
    function initializeDropdowns() {
        // 初始化週期選擇
        initializeDropdown('billing-cycle-dropdown');
        
        // 初始化每月日期選擇
        initializeMonthlyDateDropdown();
        
        // 初始化年度月份和日期選擇
        initializeYearlyDropdowns();
        
        // 監聽週期變化
        document.querySelector('#billing-cycle-dropdown input').addEventListener('change', handleCycleChange);
    }
    
    // 初始化單個下拉選單
    function initializeDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        const input = dropdown.querySelector('input');
        const ul = dropdown.querySelector('ul');
        
        // 點擊輸入框時切換下拉選單
        input.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDropdown(ul);
        });
        
        // 點擊選項時更新值
        ul.addEventListener('click', function(e) {
            if (e.target.tagName === 'LI') {
                input.value = e.target.textContent;
                input.dataset.value = e.target.dataset.value;
                input.dispatchEvent(new Event('change'));
                toggleDropdown(ul); // 選擇後關閉下拉選單
            }
        });
    }
    
    // 初始化每月日期選擇器
    function initializeMonthlyDateDropdown() {
        const dropdown = document.getElementById('monthly-date-dropdown');
        const ul = dropdown.querySelector('ul');
        
        // 填充日期選項
        for (let i = 1; i <= 31; i++) {
            const li = document.createElement('li');
            li.textContent = `${i}日`;
            li.dataset.value = i;
            ul.appendChild(li);
        }
        
        initializeDropdown('monthly-date-dropdown');
    }
    
    // 初始化年度選擇器
    function initializeYearlyDropdowns() {
        // 初始化月份選擇器
        const monthDropdown = document.getElementById('yearly-month-dropdown');
        const monthUl = monthDropdown.querySelector('ul');
        
        for (let i = 1; i <= 12; i++) {
            const li = document.createElement('li');
            li.textContent = `${i}月`;
            li.dataset.value = i;
            monthUl.appendChild(li);
        }
        
        // 初始化日期選擇器
        const dayDropdown = document.getElementById('yearly-day-dropdown');
        const dayUl = dayDropdown.querySelector('ul');
        
        for (let i = 1; i <= 31; i++) {
            const li = document.createElement('li');
            li.textContent = `${i}日`;
            li.dataset.value = i;
            dayUl.appendChild(li);
        }
        
        initializeDropdown('yearly-month-dropdown');
        initializeDropdown('yearly-day-dropdown');
    }
    
    // 處理週期變化
    function handleCycleChange(e) {
        const monthlyContainer = document.getElementById('payment-date-container');
        const yearlyContainer = document.getElementById('yearly-date-container');
        
        if (e.target.dataset.value === 'monthly') {
            monthlyContainer.style.display = 'block';
            yearlyContainer.style.display = 'none';
        } else {
            monthlyContainer.style.display = 'none';
            yearlyContainer.style.display = 'block';
        }
    }
    
    // 修改 toggleDropdown 函數
    function toggleDropdown(ul) {
        const dropdown = ul.closest('.custom-dropdown');
        const isOpen = dropdown.classList.contains('open');
        
        // 關閉所有其他下拉選單
        document.querySelectorAll('.custom-dropdown').forEach(otherDropdown => {
            if (otherDropdown !== dropdown && otherDropdown.classList.contains('open')) {
                const otherUl = otherDropdown.querySelector('ul');
                otherDropdown.classList.remove('open');
                gsap.to(otherUl, {
                    duration: 0.3,
                    opacity: 0,
                    display: 'none'
                });
            }
        });
        
        if (!isOpen) {
            // 打開當前下拉選單
            dropdown.classList.add('open');
            ul.style.display = 'block';
            gsap.fromTo(ul, 
                { opacity: 0, y: -10 }, 
                { duration: 0.3, opacity: 1, y: 0 }
            );
        } else {
            // 關閉當前下拉選單
            dropdown.classList.remove('open');
            gsap.to(ul, {
                duration: 0.3,
                opacity: 0,
                onComplete: () => {
                    ul.style.display = 'none';
                }
            });
        }
    }
    
    // 修改點擊外部關閉下拉選單的處理
    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('.custom-dropdown.open');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                const ul = dropdown.querySelector('ul');
                dropdown.classList.remove('open');
                gsap.to(ul, {
                    duration: 0.3,
                    opacity: 0,
                    onComplete: () => {
                        ul.style.display = 'none';
                    }
                });
            }
        });
    });
    
    // 監聽金額輸入
    document.getElementById('subscription-amount').addEventListener('input', function(e) {
        // 移除所有非數字字符
        let value = this.value.replace(/\D/g, '');
        
        // 限制最大長度為 5 位數
        value = value.slice(0, 5);
        
        // 直接設置值
        this.value = value;
    });
    
    // 修改新增訂閱的處理
    document.getElementById('add-subscription').addEventListener('click', function() {
        const name = document.getElementById('subscription-name').value;
        const amount = document.getElementById('subscription-amount').value;
        const cycleInput = document.querySelector('#billing-cycle-dropdown input');
        const cycle = cycleInput.dataset.value; // 從 data-value 獲取值

        let paymentDate;
        if (cycle === 'monthly') {
            const monthlyDateInput = document.querySelector('#monthly-date-dropdown input');
            paymentDate = monthlyDateInput.dataset.value;
        } else {
            const yearlyMonthInput = document.querySelector('#yearly-month-dropdown input');
            const yearlyDayInput = document.querySelector('#yearly-day-dropdown input');
            paymentDate = `${yearlyMonthInput.dataset.value}/${yearlyDayInput.dataset.value}`;
        }

        if (name && amount && paymentDate) {
            subscriptions.push({ 
                name, 
                amount, 
                cycle, 
                paymentDate 
            });
            
            // 儲存更新後的資料
            saveSubscriptions();
            
            // 清空輸入欄位
            document.getElementById('subscription-name').value = '';
            document.getElementById('subscription-amount').value = '';
            
            // 重置下拉選單到預設值
            document.querySelector('#monthly-date-dropdown input').value = '1日';
            document.querySelector('#monthly-date-dropdown input').dataset.value = '1';
            document.querySelector('#yearly-month-dropdown input').value = '1月';
            document.querySelector('#yearly-month-dropdown input').dataset.value = '1';
            document.querySelector('#yearly-day-dropdown input').value = '1日';
            document.querySelector('#yearly-day-dropdown input').dataset.value = '1';
            
            // 更新顯示
            updateCalendar();
            updateSubscriptionList();
        }
    });
    
    // 計算每月總花費
    function calculateMonthlyTotal(subscriptions) {
        return subscriptions.reduce((total, sub) => {
            if (sub.cycle === 'monthly') {
                return total + Number(sub.amount);
            } else { // yearly
                return total + (Number(sub.amount) / 12);
            }
        }, 0);
    }

    function updateSubscriptionList() {
        const container = document.getElementById('subscription-items');
        container.innerHTML = '';
        
        // 更新月花費顯示
        const monthlyTotal = calculateMonthlyTotal(subscriptions);
        document.querySelector('.monthly-spend .amount').textContent = 
            monthlyTotal.toFixed(2);
        
        subscriptions.forEach((subscription, index) => {
            const item = document.createElement('div');
            item.className = 'subscription-item';
            
            // 修改付款日期顯示邏輯
            const paymentDateDisplay = subscription.cycle === 'monthly'
                ? String(subscription.paymentDate).padStart(2, '0')
                : subscription.paymentDate.split('/')
                    .map(num => String(num).padStart(2, '0'))
                    .join(' / ');
            
            // 計算每月平均花費
            const monthlyAverage = subscription.cycle === 'yearly' 
                ? (subscription.amount / 12).toFixed(2)
                : '';

            item.innerHTML = `
                <div class="col">${subscription.name}</div>
                <div class="col">${subscription.amount}${monthlyAverage ? ` (${monthlyAverage} / 月)` : ''}</div>
                <div class="col">${paymentDateDisplay}</div>
                <div class="col">
                    <div class="action-buttons">
                        <button class="action-button delete-button" data-index="${index}">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(item);
        });
        
        // 綁定刪除按鈕事件
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                subscriptions.splice(index, 1);
                
                // 儲存更新後的資料
                saveSubscriptions();
                
                updateSubscriptionList();
                updateCalendar();
            });
        });
    }

    // 顯示 tooltip
    function showTooltip(event, subscriptions, day) {
        // 移除舊的 tooltip
        hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'calendar-tooltip';
        
        // 創建 tooltip 內容
        tooltip.innerHTML = `
            ${subscriptions.map(sub => `
                <div class="calendar-tooltip-item">
                    <span class="name">${sub.name}</span>
                    <span class="amount">${sub.amount} / ${sub.cycle === 'monthly' ? '月' : '年'}</span>
                </div>
            `).join('')}
        `;
        
        // 定位 tooltip
        document.body.appendChild(tooltip);
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        
        // 顯示 tooltip
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
        });
    }

    // 隱藏 tooltip
    function hideTooltip() {
        const tooltip = document.querySelector('.calendar-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    // 修改表單的展開/收合動畫
    const form = document.querySelector('.subscription-form');
    const formHeader = form.querySelector('.form-header');
    const formContent = form.querySelector('.form-content');

    // 初始化時收合表單
    gsap.set(formContent, {
        height: 0,
        opacity: 0,
        marginTop: 0,
        y: 0 // 重置初始位置
    });

    // 初始化箭頭位置
    gsap.set(form.querySelector('.toggle-form'), {
        rotation: 270
    });

    formHeader.addEventListener('click', function() {
        const isCollapsed = form.classList.contains('collapsed');
        const animationDuration = 0.3; // 縮短動畫時間
        const easeType = 'power2.inOut'; // 使用更平滑的緩動函數
        
        if (isCollapsed) {
            // 展開表單
            form.classList.remove('collapsed');
            
            const tl = gsap.timeline({
                defaults: { ease: easeType }
            });
            
            // 設置原點為頂部
            gsap.set(formContent, {
                transformOrigin: 'top'
            });
            
            // 簡化動畫，使用單一時間軸
            tl.to(formContent, {
                height: 'auto',
                opacity: 1,
                marginTop: 20,
                duration: animationDuration,
                visibility: 'visible'
            });
            
            // 箭頭動畫
            gsap.to(form.querySelector('.toggle-form'), {
                rotation: 360,
                duration: animationDuration,
                ease: easeType
            });
        } else {
            // 收合表單
            form.classList.add('collapsed');
            
            const tl = gsap.timeline({
                defaults: { ease: easeType }
            });
            
            // 簡化收合動畫
            tl.to(formContent, {
                height: 0,
                opacity: 0,
                marginTop: 0,
                duration: animationDuration,
                visibility: 'hidden'
            });
            
            // 箭頭動畫
            gsap.to(form.querySelector('.toggle-form'), {
                rotation: 270,
                duration: animationDuration,
                ease: easeType
            });
        }
    });

    // 修改訂閱列表的展開/收合動畫
    const list = document.querySelector('.subscription-list');
    const listHeader = list.querySelector('.list-header');
    const listContent = list.querySelector('.list-content');

    // 初始化時收合列表（與表單一樣）
    gsap.set(listContent, {
        height: 0,
        opacity: 0,
        marginTop: 0,
        y: 0
    });

    // 初始化箭頭位置
    gsap.set(list.querySelector('.toggle-list'), {
        rotation: 270 // 初始時朝左
    });

    listHeader.addEventListener('click', function() {
        const isCollapsed = list.classList.contains('collapsed');
        const animationDuration = 0.5;
        const easeType = 'power3.inOut';
        
        if (isCollapsed) {
            // 展開列表
            list.classList.remove('collapsed');
            
            const tl = gsap.timeline({
                defaults: { ease: easeType }
            });
            
            // 設置原點為頂部
            gsap.set(listContent, {
                transformOrigin: 'top'
            });
            
            tl.to(listContent, {
                height: 'auto',
                duration: animationDuration * 0.6,
                ease: 'power3.out'
            })
            .to(listContent, {
                opacity: 1,
                marginTop: 20,
                duration: animationDuration,
                visibility: 'visible'
            }, '-=0.2');
            
            gsap.to(list.querySelector('.toggle-list'), {
                rotation: 360,
                duration: animationDuration * 0.8,
                ease: 'power3.out'
            });
        } else {
            // 收合列表
            list.classList.add('collapsed');
            
            const tl = gsap.timeline({
                defaults: { ease: easeType }
            });
            
            tl.to(listContent, {
                opacity: 0,
                marginTop: 0,
                duration: animationDuration * 0.8,
                visibility: 'hidden'
            })
            .to(listContent, {
                height: 0,
                duration: animationDuration * 0.6,
            }, '-=0.4');
            
            gsap.to(list.querySelector('.toggle-list'), {
                rotation: 270,
                duration: animationDuration * 0.6,
                ease: 'power3.in'
            });
        }
    });

    // 載入儲存的資料
    loadSubscriptions();

    // 在 DOMContentLoaded 事件處理函數中添加
    document.querySelector('.prev-month').addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    document.querySelector('.next-month').addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    // 初始化 GSAP 動畫
    initGSAPAnimation();
});

// 初始化 GSAP 動畫的函數
function initGSAPAnimation() {
    tl = gsap.timeline();
    
    // 設置初始狀態
    gsap.set("#demo rect:first-child", { attr: { width: 40 } });
    
    // 設置動畫序列
    tl.to("#demo rect:first-child", {
        duration: 0.4,
        attr: { width: 150 },
        ease: "power4.inOut"
    });
    
    tl.to("#demo text", {
        duration: 0.4,
        fill: "#ffffff", // 改為全白
        ease: "none"
    }, 0);
    
    tl.to("#demo polyline, #demo line", {
        duration: 0.4,
        x: 14,
        stroke: "#ffffff", // 改為全白
        ease: "power4.inOut"
    }, 0);
    
    tl.to("#demo line", {
        duration: 0.4,
        attr: { x2: 3 },
        ease: "power4.inOut"
    }, 0);
    
    tl.reversed(true);
    
    // 添加事件監聽器
    const demoButton = document.querySelector("#demo");
    if (demoButton) {
        demoButton.addEventListener("mouseenter", function() {
            doCoolStuff(); // 保留動畫效果
        });
        demoButton.addEventListener("mouseleave", function() {
            doCoolStuff(); // 保留動畫效果
        });
    }
}

function doCoolStuff() {
    tl.reversed(!tl.reversed());
}