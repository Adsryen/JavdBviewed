/**
 * 月份范围选择器组件
 * 替代原生 <input type="month"> 的现代化实现
 */

export interface MonthRange {
  start: string; // YYYY-MM 格式
  end: string;   // YYYY-MM 格式
}

export interface MonthRangePickerOptions {
  startValue?: string;
  endValue?: string;
  minYear?: number;
  maxYear?: number;
  onChange?: (range: MonthRange) => void;
}

export class MonthRangePicker {
  private container: HTMLDivElement;
  private startInput: HTMLInputElement;
  private endInput: HTMLInputElement;
  private startDropdown: HTMLDivElement | null = null;
  private endDropdown: HTMLDivElement | null = null;
  private options: MonthRangePickerOptions;

  constructor(containerId: string, options: MonthRangePickerOptions = {}) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    
    this.container = container as HTMLDivElement;
    this.options = {
      minYear: options.minYear || 2020,
      maxYear: options.maxYear || new Date().getFullYear(),
      ...options
    };

    this.startInput = this.createInput('start', options.startValue);
    this.endInput = this.createInput('end', options.endValue);
    
    this.render();
    this.attachEvents();
  }

  private createInput(type: 'start' | 'end', value?: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.placeholder = type === 'start' ? '开始月份' : '结束月份';
    input.value = value ? this.formatDisplay(value) : '';
    input.dataset.value = value || '';
    input.className = 'month-picker-input';
    return input;
  }

  private formatDisplay(value: string): string {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) return '';
    const [year, month] = value.split('-');
    return `${year}年${month}月`;
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'month-range-picker';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'month-range-wrapper';
    
    const startWrapper = this.createInputWrapper(this.startInput, 'start');
    const separator = document.createElement('span');
    separator.className = 'month-range-separator';
    separator.textContent = '—';
    const endWrapper = this.createInputWrapper(this.endInput, 'end');
    
    wrapper.appendChild(startWrapper);
    wrapper.appendChild(separator);
    wrapper.appendChild(endWrapper);
    
    this.container.appendChild(wrapper);
  }

  private createInputWrapper(input: HTMLInputElement, type: 'start' | 'end'): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'month-picker-wrapper';
    wrapper.appendChild(input);
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-calendar-alt month-picker-icon';
    wrapper.appendChild(icon);
    
    return wrapper;
  }

  private attachEvents(): void {
    this.startInput.addEventListener('click', () => this.showDropdown('start'));
    this.endInput.addEventListener('click', () => this.showDropdown('end'));
    
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.month-picker-wrapper') && !target.closest('.month-picker-dropdown')) {
        this.hideAllDropdowns();
      }
    });
  }

  private showDropdown(type: 'start' | 'end'): void {
    this.hideAllDropdowns();
    
    const input = type === 'start' ? this.startInput : this.endInput;
    const dropdown = this.createDropdown(type);
    
    if (type === 'start') {
      this.startDropdown = dropdown;
    } else {
      this.endDropdown = dropdown;
    }
    
    const wrapper = input.parentElement!;
    wrapper.appendChild(dropdown);
    
    // 定位
    const rect = wrapper.getBoundingClientRect();
    dropdown.style.top = `${rect.height + 4}px`;
    dropdown.style.left = '0';
  }

  private hideAllDropdowns(): void {
    if (this.startDropdown) {
      this.startDropdown.remove();
      this.startDropdown = null;
    }
    if (this.endDropdown) {
      this.endDropdown.remove();
      this.endDropdown = null;
    }
  }

  private createDropdown(type: 'start' | 'end'): HTMLDivElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'month-picker-dropdown';
    
    const currentValue = type === 'start' 
      ? this.startInput.dataset.value 
      : this.endInput.dataset.value;
    
    const [currentYear, currentMonth] = currentValue 
      ? currentValue.split('-').map(Number)
      : [new Date().getFullYear(), new Date().getMonth() + 1];
    
    // 年份选择器
    const yearSelector = this.createYearSelector(currentYear, (year) => {
      dropdown.innerHTML = '';
      dropdown.appendChild(this.createYearSelector(year, (y) => {
        dropdown.innerHTML = '';
        dropdown.appendChild(this.createYearSelector(y, () => {}));
        dropdown.appendChild(this.createMonthGrid(y, currentMonth, type));
      }));
      dropdown.appendChild(this.createMonthGrid(year, currentMonth, type));
    });
    
    // 月份网格
    const monthGrid = this.createMonthGrid(currentYear, currentMonth, type);
    
    dropdown.appendChild(yearSelector);
    dropdown.appendChild(monthGrid);
    
    return dropdown;
  }

  private createYearSelector(currentYear: number, onChange: (year: number) => void): HTMLDivElement {
    const selector = document.createElement('div');
    selector.className = 'month-picker-year-selector';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'year-nav-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      if (currentYear > this.options.minYear!) {
        onChange(currentYear - 1);
      }
    };
    prevBtn.disabled = currentYear <= this.options.minYear!;
    
    const yearLabel = document.createElement('span');
    yearLabel.className = 'year-label';
    yearLabel.textContent = `${currentYear}年`;
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'year-nav-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      if (currentYear < this.options.maxYear!) {
        onChange(currentYear + 1);
      }
    };
    nextBtn.disabled = currentYear >= this.options.maxYear!;
    
    selector.appendChild(prevBtn);
    selector.appendChild(yearLabel);
    selector.appendChild(nextBtn);
    
    return selector;
  }

  private createMonthGrid(year: number, selectedMonth: number, type: 'start' | 'end'): HTMLDivElement {
    const grid = document.createElement('div');
    grid.className = 'month-picker-grid';
    
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    months.forEach((monthLabel, index) => {
      const monthNum = index + 1;
      const btn = document.createElement('button');
      btn.className = 'month-btn';
      btn.textContent = monthLabel;
      
      const value = `${year}-${String(monthNum).padStart(2, '0')}`;
      
      // 高亮当前选中
      if (monthNum === selectedMonth) {
        btn.classList.add('selected');
      }
      
      // 高亮当前月
      const now = new Date();
      if (year === now.getFullYear() && monthNum === now.getMonth() + 1) {
        btn.classList.add('current');
      }
      
      btn.onclick = (e) => {
        e.stopPropagation();
        this.selectMonth(type, value);
        this.hideAllDropdowns();
      };
      
      grid.appendChild(btn);
    });
    
    return grid;
  }

  private selectMonth(type: 'start' | 'end', value: string): void {
    const input = type === 'start' ? this.startInput : this.endInput;
    input.value = this.formatDisplay(value);
    input.dataset.value = value;
    
    if (this.options.onChange) {
      this.options.onChange({
        start: this.startInput.dataset.value || '',
        end: this.endInput.dataset.value || ''
      });
    }
  }

  public getValue(): MonthRange {
    return {
      start: this.startInput.dataset.value || '',
      end: this.endInput.dataset.value || ''
    };
  }

  public setValue(range: MonthRange): void {
    if (range.start) {
      this.startInput.value = this.formatDisplay(range.start);
      this.startInput.dataset.value = range.start;
    }
    if (range.end) {
      this.endInput.value = this.formatDisplay(range.end);
      this.endInput.dataset.value = range.end;
    }
  }

  public destroy(): void {
    this.hideAllDropdowns();
    this.container.innerHTML = '';
  }
}
