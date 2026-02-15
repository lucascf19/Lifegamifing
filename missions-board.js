// Sistema de Missões do Quadro
class MissionsBoard {
    constructor() {
        this.missions = this.loadMissions();
        this.energyTotal = this.loadEnergy();
        this.focusCrystals = this.loadCrystals();
        this.nextId = this.getNextId();
        
        // Timers para animações dos contadores
        this.energyTimer = null;
        this.crystalsTimer = null;
        
        this.init();
    }

    init() {
        // Para todos os timers ao inicializar (segurança)
        this.missions.forEach(mission => {
            if (mission.type === 'timer' && mission.isRunning) {
                mission.isRunning = false;
            }
        });
        this.saveMissions();
        
        this.updateCounters();
        this.renderMissions();
        this.setupEventListeners();
        
        // Adiciona algumas missões de exemplo se não houver nenhuma
        if (this.missions.length === 0) {
            this.addExampleMissions();
        }
    }

    loadMissions() {
        const saved = localStorage.getItem('boardMissions');
        const missions = saved ? JSON.parse(saved) : [];
        
        // Garante que todas as missões tenham as propriedades necessárias
        return missions.map(mission => ({
            ...mission,
            completed: mission.completed || false,
            type: mission.type || 'checklist',
            progress: mission.progress || 0,
            timeElapsed: mission.timeElapsed || 0,
            isRunning: false // Sempre reseta timers ao carregar
        }));
    }

    saveMissions() {
        localStorage.setItem('boardMissions', JSON.stringify(this.missions));
    }

    loadEnergy() {
        const saved = localStorage.getItem('energyTotal');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveEnergy() {
        localStorage.setItem('energyTotal', this.energyTotal.toString());
    }

    loadCrystals() {
        const saved = localStorage.getItem('focusCrystals');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveCrystals() {
        localStorage.setItem('focusCrystals', this.focusCrystals.toString());
    }

    getNextId() {
        const saved = localStorage.getItem('nextMissionId');
        const id = saved ? parseInt(saved, 10) : 1;
        localStorage.setItem('nextMissionId', (id + 1).toString());
        return id;
    }

    addExampleMissions() {
        const examples = [
            // Missões de Checklist (Simples)
            {
                id: this.getNextId(),
                name: 'Escovar os dentes',
                category: 'Saúde',
                type: 'checklist',
                reward: 5,
                completed: false,
                icon: '🦷',
                color: 'green'
            },
            {
                id: this.getNextId(),
                name: 'Comer uma refeição saudável',
                category: 'Saúde',
                type: 'checklist',
                reward: 5,
                completed: false,
                icon: '🥗',
                color: 'green'
            },
            {
                id: this.getNextId(),
                name: 'Lavar a louça',
                category: 'Limpeza',
                type: 'checklist',
                reward: 5,
                completed: false,
                icon: '🧽',
                color: 'orange'
            },
            // Missão de Contador (Progressiva)
            {
                id: this.getNextId(),
                name: 'Beber 2L de Água',
                category: 'Saúde',
                type: 'counter',
                reward: 2, // Por 250ml
                target: 2000, // 2L em ml
                progress: 0,
                completed: false,
                icon: '💧',
                color: 'blue'
            },
            // Missão de Tempo (Timer)
            {
                id: this.getNextId(),
                name: 'Organizar a casa (10 min)',
                category: 'Limpeza',
                type: 'timer',
                reward: 15,
                crystalReward: 1,
                duration: 600, // 10 minutos em segundos
                timeElapsed: 0,
                isRunning: false,
                completed: false,
                icon: '🏠',
                color: 'orange'
            }
        ];
        
        this.missions = examples;
        this.saveMissions();
        this.renderMissions();
    }

    addMission(name, category, reward) {
        const mission = {
            id: this.nextId++,
            name: name,
            category: category,
            reward: parseInt(reward, 10),
            completed: false
        };
        
        this.missions.push(mission);
        this.saveMissions();
        this.renderMissions();
        this.updateEmptyState();
    }

    completeMission(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.completed) return;

        // Para missões do tipo timer, não completa diretamente
        if (mission.type === 'timer') {
            return;
        }

        // Para missões do tipo counter, não completa diretamente
        if (mission.type === 'counter') {
            return;
        }

        // Missões de checklist
        if (mission.type === 'checklist' || !mission.type) {
            mission.completed = true;
            mission.completedAt = new Date().toISOString();
            this.saveMissions();
            
            // Adiciona recompensa (checklist dá energia direta)
            this.energyTotal += mission.reward || 5;
            this.saveEnergy();
            
            // Atualiza contadores com animação
            this.updateCounters();
            
            // Re-renderiza as missões
            this.renderMissions();
        }
    }

    addWaterProgress(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.type !== 'counter' || mission.completed) return;

        mission.progress = (mission.progress || 0) + 250;
        this.saveMissions();
        
        // Adiciona energia por cada 250ml
        this.energyTotal += mission.reward || 2;
        this.saveEnergy();
        
        // Verifica se completou a meta
        if (mission.progress >= mission.target) {
            mission.completed = true;
            mission.completedAt = new Date().toISOString();
        }
        
        this.updateCounters();
        this.renderMissions();
    }

    startTimer(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.type !== 'timer' || mission.completed || mission.isRunning) return;

        const alreadyElapsed = mission.timeElapsed || 0;
        mission.isRunning = true;
        mission.startTime = Date.now() - (alreadyElapsed * 1000); // Ajusta para considerar tempo já decorrido
        this.saveMissions();
        this.renderMissions();

        // Atualiza o timer a cada segundo
        const timerInterval = setInterval(() => {
            const mission = this.missions.find(m => m.id === missionId);
            if (!mission || !mission.isRunning) {
                clearInterval(timerInterval);
                return;
            }

            const elapsed = Math.floor((Date.now() - mission.startTime) / 1000);
            mission.timeElapsed = elapsed;
            
            // Verifica se completou o tempo
            if (elapsed >= mission.duration) {
                mission.completed = true;
                mission.isRunning = false;
                mission.completedAt = new Date().toISOString();
                mission.timeElapsed = mission.duration;
                this.saveMissions();
                
                // Adiciona recompensas
                this.energyTotal += mission.reward || 15;
                this.focusCrystals += mission.crystalReward || 1;
                this.saveEnergy();
                this.saveCrystals();
                
                clearInterval(timerInterval);
                this.updateCounters();
            }
            
            this.renderMissions();
        }, 1000);
    }

    stopTimer(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.type !== 'timer' || !mission.isRunning) return;

        // Calcula o tempo decorrido antes de parar
        if (mission.startTime) {
            const elapsed = Math.floor((Date.now() - mission.startTime) / 1000);
            mission.timeElapsed = (mission.timeElapsed || 0) + elapsed;
        }
        
        mission.isRunning = false;
        delete mission.startTime;
        this.saveMissions();
        this.renderMissions();
    }

    undoMission(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || !mission.completed) return;

        // Para timer, para o timer se estiver rodando
        if (mission.type === 'timer' && mission.isRunning) {
            this.stopTimer(missionId);
        }

        // Remove a marcação de concluída
        mission.completed = false;
        delete mission.completedAt;
        
        // Reverte recompensas baseado no tipo
        if (mission.type === 'timer') {
            this.energyTotal -= mission.reward || 15;
            this.focusCrystals -= mission.crystalReward || 1;
            mission.timeElapsed = 0;
            mission.isRunning = false;
        } else if (mission.type === 'counter') {
            // Para counter, reverte toda a energia ganha
            const increments = Math.floor((mission.progress || 0) / 250);
            this.energyTotal -= increments * (mission.reward || 2);
            mission.progress = 0;
        } else {
            // Checklist
            this.energyTotal -= mission.reward || 5;
        }
        
        // Garante que os valores não fiquem negativos
        if (this.focusCrystals < 0) this.focusCrystals = 0;
        if (this.energyTotal < 0) this.energyTotal = 0;
        
        this.saveMissions();
        this.saveCrystals();
        this.saveEnergy();
        
        // Atualiza contadores com animação
        this.updateCounters();
        
        // Re-renderiza as missões
        this.renderMissions();
    }

    updateCounters() {
        const energyEl = document.getElementById('energyTotal');
        const crystalsEl = document.getElementById('focusCrystals');
        
        if (energyEl) {
            this.animateCounter(energyEl, this.energyTotal, 'energy');
        }
        if (crystalsEl) {
            this.animateCounter(crystalsEl, this.focusCrystals, 'crystals');
        }
    }

    animateCounter(element, targetValue, type) {
        // Limpa timer anterior se existir
        if (type === 'energy' && this.energyTimer) {
            clearInterval(this.energyTimer);
            this.energyTimer = null;
        }
        if (type === 'crystals' && this.crystalsTimer) {
            clearInterval(this.crystalsTimer);
            this.crystalsTimer = null;
        }

        const currentValue = parseInt(element.textContent) || 0;
        
        // Se já está no valor alvo, apenas atualiza sem animação
        if (currentValue === targetValue) {
            element.textContent = targetValue;
            return;
        }

        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 300;
        const steps = Math.abs(targetValue - currentValue);
        
        // Evita divisão por zero
        if (steps === 0) {
            element.textContent = targetValue;
            return;
        }
        
        const stepDuration = Math.max(10, duration / steps); // Mínimo de 10ms entre steps

        let current = currentValue;
        const timer = setInterval(() => {
            current += increment;
            
            // Verifica se passou do alvo (para incrementos negativos)
            if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
                current = targetValue;
                element.textContent = current;
                clearInterval(timer);
                
                // Limpa a referência do timer
                if (type === 'energy') {
                    this.energyTimer = null;
                } else if (type === 'crystals') {
                    this.crystalsTimer = null;
                }
            } else {
                element.textContent = current;
            }
            
            // Efeito de destaque apenas no início e fim
            if (current === currentValue || current === targetValue) {
                element.classList.add('scale-110');
                setTimeout(() => {
                    element.classList.remove('scale-110');
                }, 100);
            }
        }, stepDuration);
        
        // Armazena a referência do timer
        if (type === 'energy') {
            this.energyTimer = timer;
        } else if (type === 'crystals') {
            this.crystalsTimer = timer;
        }
    }

    getCategoryIcon(category) {
        const icons = {
            'Estudo': '📚',
            'Trabalho': '💼',
            'Saúde': '💪',
            'Criatividade': '🎨',
            'Social': '👥',
            'Outros': '🔖'
        };
        return icons[category] || '🔖';
    }

    getCategoryColor(category) {
        const colors = {
            'Estudo': 'bg-purple-600/20 border-purple-500/50 text-purple-300',
            'Trabalho': 'bg-blue-600/20 border-blue-500/50 text-blue-300',
            'Saúde': 'bg-green-600/20 border-green-500/50 text-green-300',
            'Criatividade': 'bg-pink-600/20 border-pink-500/50 text-pink-300',
            'Social': 'bg-yellow-600/20 border-yellow-500/50 text-yellow-300',
            'Outros': 'bg-gray-600/20 border-gray-500/50 text-gray-300'
        };
        return colors[category] || colors['Outros'];
    }

    renderMissions() {
        const grid = document.getElementById('missionsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        // Separa missões concluídas e não concluídas
        const activeMissions = this.missions.filter(m => !m.completed);
        const completedMissions = this.missions.filter(m => m.completed);

        // Renderiza missões ativas primeiro
        activeMissions.forEach(mission => {
            grid.appendChild(this.createMissionCard(mission));
        });

        // Renderiza missões concluídas depois (com visual diferente)
        completedMissions.forEach(mission => {
            grid.appendChild(this.createMissionCard(mission, true));
        });

        this.updateEmptyState();
    }

    getMissionColor(type, color) {
        const colorMap = {
            'green': 'border-green-500/50 bg-green-900/10',
            'blue': 'border-blue-500/50 bg-blue-900/10',
            'orange': 'border-orange-500/50 bg-orange-900/10'
        };
        return colorMap[color] || 'border-purple-soft/30';
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    createMissionCard(mission, isCompleted = false) {
        const card = document.createElement('div');
        const missionColor = this.getMissionColor(mission.type, mission.color);
        const completedClass = isCompleted 
            ? 'opacity-75 border-green-600/50 bg-green-900/10' 
            : missionColor;
        
        card.className = `bg-slate-dark border ${completedClass} rounded-lg p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-soft/50`;
        card.setAttribute('data-mission-id', mission.id);

        // Renderiza baseado no tipo de missão
        if (mission.type === 'checklist') {
            card.innerHTML = this.renderChecklistCard(mission, isCompleted);
        } else if (mission.type === 'counter') {
            card.innerHTML = this.renderCounterCard(mission, isCompleted);
        } else if (mission.type === 'timer') {
            card.innerHTML = this.renderTimerCard(mission, isCompleted);
        } else {
            // Missão padrão (fallback)
            card.innerHTML = this.renderDefaultCard(mission, isCompleted);
        }

        return card;
    }

    renderChecklistCard(mission, isCompleted) {
        const icon = mission.icon || '✓';
        if (isCompleted) {
            return `
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${icon}</span>
                        <h3 class="text-xl font-semibold text-gray-100 flex-1 line-through">${mission.name}</h3>
                    </div>
                    <span class="text-green-400 text-sm font-medium">✓ Concluída</span>
                </div>
                
                <div class="mb-4">
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border bg-green-600/20 border-green-500/50 text-green-300 opacity-60">
                        ${this.getCategoryIcon(mission.category)} ${mission.category}
                    </span>
                </div>
                
                <div class="flex items-center justify-between pt-3 border-t border-purple-soft/20">
                    <div class="flex items-center gap-2 text-green-400 opacity-60">
                        <span class="text-xl">⚡</span>
                        <span class="font-semibold">+${mission.reward}</span>
                        <span class="text-sm text-gray-400">energia</span>
                    </div>
                    
                    <button 
                        onclick="missionsBoard.undoMission(${mission.id})"
                        class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                        <span>↶</span>
                        <span>Desfazer</span>
                    </button>
                </div>
            `;
        }
        return `
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${icon}</span>
                    <h3 class="text-xl font-semibold text-gray-100 flex-1">${mission.name}</h3>
                </div>
            </div>
            
            <div class="mb-4">
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border bg-green-600/20 border-green-500/50 text-green-300">
                    ${this.getCategoryIcon(mission.category)} ${mission.category}
                </span>
            </div>
            
            <div class="flex items-center justify-between pt-3 border-t border-purple-soft/20">
                <div class="flex items-center gap-2 text-green-400">
                    <span class="text-xl">⚡</span>
                    <span class="font-semibold">+${mission.reward}</span>
                    <span class="text-sm text-gray-400">energia</span>
                </div>
                
                <button 
                    onclick="missionsBoard.completeMission(${mission.id})"
                    class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                    <span>✓</span>
                    <span>Concluir</span>
                </button>
            </div>
        `;
    }

    renderCounterCard(mission, isCompleted) {
        const progress = mission.progress || 0;
        const target = mission.target || 2000;
        const percentage = Math.min((progress / target) * 100, 100);
        const icon = mission.icon || '💧';
        
        if (isCompleted) {
            return `
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${icon}</span>
                        <h3 class="text-xl font-semibold text-gray-100 flex-1 line-through">${mission.name}</h3>
                    </div>
                    <span class="text-green-400 text-sm font-medium">✓ Concluída</span>
                </div>
                
                <div class="mb-4">
                    <div class="flex justify-between text-sm mb-2">
                        <span class="text-blue-300">${(progress/1000).toFixed(1)}L / ${(target/1000).toFixed(1)}L</span>
                        <span class="text-blue-300">100%</span>
                    </div>
                    <div class="w-full bg-slate-darker rounded-full h-3">
                        <div class="bg-blue-500 h-3 rounded-full" style="width: 100%"></div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between pt-3 border-t border-purple-soft/20">
                    <div class="flex items-center gap-2 text-blue-400 opacity-60">
                        <span class="text-xl">⚡</span>
                        <span class="font-semibold">+${Math.floor(progress/250) * mission.reward}</span>
                        <span class="text-sm text-gray-400">energia</span>
                    </div>
                    
                    <button 
                        onclick="missionsBoard.undoMission(${mission.id})"
                        class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                        <span>↶</span>
                        <span>Desfazer</span>
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${icon}</span>
                    <h3 class="text-xl font-semibold text-gray-100 flex-1">${mission.name}</h3>
                </div>
            </div>
            
            <div class="mb-4">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-blue-300">${(progress/1000).toFixed(1)}L / ${(target/1000).toFixed(1)}L</span>
                    <span class="text-blue-300">${Math.round(percentage)}%</span>
                </div>
                <div class="w-full bg-slate-darker rounded-full h-3 mb-3">
                    <div class="bg-blue-500 h-3 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
                </div>
                <button 
                    onclick="missionsBoard.addWaterProgress(${mission.id})"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    <span>+</span>
                    <span>250ml (+${mission.reward} ⚡)</span>
                </button>
            </div>
            
            <div class="flex items-center justify-between pt-3 border-t border-purple-soft/20">
                <div class="flex items-center gap-2 text-blue-400">
                    <span class="text-xl">⚡</span>
                    <span class="font-semibold">+${mission.reward}</span>
                    <span class="text-sm text-gray-400">por 250ml</span>
                </div>
            </div>
        `;
    }

    renderTimerCard(mission, isCompleted) {
        const icon = mission.icon || '⏱️';
        const timeElapsed = mission.timeElapsed || 0;
        const duration = mission.duration || 600;
        const remaining = Math.max(0, duration - timeElapsed);
        const percentage = (timeElapsed / duration) * 100;
        
        if (isCompleted) {
            return `
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${icon}</span>
                        <h3 class="text-xl font-semibold text-gray-100 flex-1 line-through">${mission.name}</h3>
                    </div>
                    <span class="text-green-400 text-sm font-medium">✓ Concluída</span>
                </div>
                
                <div class="mb-4">
                    <div class="flex justify-between text-sm mb-2">
                        <span class="text-orange-300">Tempo: ${this.formatTime(duration)}</span>
                        <span class="text-green-400">Completo!</span>
                    </div>
                    <div class="w-full bg-slate-darker rounded-full h-3">
                        <div class="bg-green-500 h-3 rounded-full" style="width: 100%"></div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between pt-3 border-t border-purple-soft/20">
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2 text-orange-400">
                            <span class="text-lg">⚡</span>
                            <span class="font-semibold">+${mission.reward}</span>
                            <span class="text-xs text-gray-400">energia</span>
                        </div>
                        <div class="flex items-center gap-2 text-purple-lighter">
                            <span class="text-lg">💎</span>
                            <span class="font-semibold">+${mission.crystalReward || 1}</span>
                            <span class="text-xs text-gray-400">cristal</span>
                        </div>
                    </div>
                    
                    <button 
                        onclick="missionsBoard.undoMission(${mission.id})"
                        class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                        <span>↶</span>
                        <span>Desfazer</span>
                    </button>
                </div>
            `;
        }
        
        const isRunning = mission.isRunning || false;
        
        return `
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${icon}</span>
                    <h3 class="text-xl font-semibold text-gray-100 flex-1">${mission.name}</h3>
                </div>
            </div>
            
            <div class="mb-4">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-orange-300">Tempo restante: ${this.formatTime(remaining)}</span>
                    <span class="text-orange-300">${Math.round(percentage)}%</span>
                </div>
                <div class="w-full bg-slate-darker rounded-full h-3 mb-3">
                    <div class="bg-orange-500 h-3 rounded-full transition-all duration-1000" style="width: ${percentage}%"></div>
                </div>
                ${!isRunning ? `
                    <button 
                        onclick="missionsBoard.startTimer(${mission.id})"
                        class="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <span>▶</span>
                        <span>Iniciar Timer</span>
                    </button>
                ` : `
                    <button 
                        onclick="missionsBoard.stopTimer(${mission.id})"
                        class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <span>⏸</span>
                        <span>Pausar Timer</span>
                    </button>
                `}
            </div>
            
            <div class="flex items-center justify-between pt-3 border-t border-purple-soft/20">
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2 text-orange-400">
                        <span class="text-lg">⚡</span>
                        <span class="font-semibold">+${mission.reward}</span>
                        <span class="text-xs text-gray-400">energia</span>
                    </div>
                    <div class="flex items-center gap-2 text-purple-lighter">
                        <span class="text-lg">💎</span>
                        <span class="font-semibold">+${mission.crystalReward || 1}</span>
                        <span class="text-xs text-gray-400">cristal</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderDefaultCard(mission, isCompleted) {
        // Código padrão anterior (fallback)
        if (isCompleted) {
            return `
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-semibold text-gray-100 flex-1 line-through">${mission.name}</h3>
                    <span class="text-green-400 text-sm font-medium">✓ Concluída</span>
                </div>
                
                <div class="mb-4">
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${this.getCategoryColor(mission.category)} opacity-60">
                        ${this.getCategoryIcon(mission.category)} ${mission.category}
                    </span>
                </div>
                
                <div class="flex items-center justify-between pt-3 border-t border-purple-soft/20">
                    <div class="flex items-center gap-2 text-purple-lighter opacity-60">
                        <span class="text-xl">💎</span>
                        <span class="font-semibold">${mission.reward}</span>
                        <span class="text-sm text-gray-400">cristais</span>
                    </div>
                    
                    <button 
                        onclick="missionsBoard.undoMission(${mission.id})"
                        class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                        <span>↶</span>
                        <span>Desfazer</span>
                    </button>
                </div>
            `;
        }
        return `
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-semibold text-gray-100 flex-1">${mission.name}</h3>
            </div>
            
            <div class="mb-4">
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${this.getCategoryColor(mission.category)}">
                    ${this.getCategoryIcon(mission.category)} ${mission.category}
                </span>
            </div>
            
            <div class="flex items-center justify-between pt-3 border-t border-purple-soft/20">
                <div class="flex items-center gap-2 text-purple-lighter">
                    <span class="text-xl">💎</span>
                    <span class="font-semibold">${mission.reward}</span>
                    <span class="text-sm text-gray-400">cristais</span>
                </div>
                
                <button 
                    onclick="missionsBoard.completeMission(${mission.id})"
                    class="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                    <span>✓</span>
                    <span>Concluir</span>
                </button>
            </div>
        `;
    }

    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const grid = document.getElementById('missionsGrid');
        
        // Mostra estado vazio apenas se não houver nenhuma missão (ativa ou concluída)
        if (this.missions.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (grid) grid.classList.add('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            if (grid) grid.classList.remove('hidden');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('missionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddMission();
            });
        }

        // Fechar modal ao clicar fora
        const modal = document.getElementById('addMissionModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeAddMissionModal();
                }
            });
        }
    }

    handleAddMission() {
        const name = document.getElementById('missionName').value.trim();
        const category = document.getElementById('missionCategory').value;
        const reward = document.getElementById('missionReward').value;

        if (name && category && reward) {
            this.addMission(name, category, reward);
            closeAddMissionModal();
            
            // Reset form
            document.getElementById('missionForm').reset();
            document.getElementById('missionReward').value = '10';
        }
    }
}

// Funções globais para o modal
function openAddMissionModal() {
    const modal = document.getElementById('addMissionModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeAddMissionModal() {
    const modal = document.getElementById('addMissionModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Inicialização
let missionsBoard;

document.addEventListener('DOMContentLoaded', () => {
    missionsBoard = new MissionsBoard();
    window.missionsBoard = missionsBoard; // Torna acessível globalmente
});
