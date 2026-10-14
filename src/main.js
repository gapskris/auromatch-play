// Main Application Entry Module
import { loadProfileState, saveProfileState, encryptAndExportBackup, decryptAndImportBackup, executeAbsolutePurge, profileState } from './controllers/storageAdapter.js';
import { initAudioEngine, playAshramMeditationGong } from './audio/synthesizer.js';
import { updateVolumeSetting, updateVoicePreference, updateSanctuaryMode, toggleSecularTerminology, updateExperienceMode } from './controllers/settings.js';
import { triggerReflectionDissolve } from './ui/particles.js';
import { playMeditativeSpeech, stopSpeechSynthesis, speakCustomSpeech, openGlossaryOverlaySheet } from './ui/scriptureCard.js';
import { 
  GameManager,
  activeGameManager,
  routeToScreen,
  getCurrentScreen,
  getPreviousScreen,
  startGardenSanctuary, 
  drawDailyOracle, 
  checkCalendarGreetings, 
  applySanctuaryModeTheme 
} from './controllers/gameManager.js';
import { ThemeManager, REALMS } from './controllers/themeManager.js';
import { reshuffleBoard, renderBoard } from './ui/boardRenderer.js';

window.addEventListener('load', () => {
    // Load local state
    loadProfileState();
    
    // Apply time-of-day clock gradients
    applySanctuaryModeTheme();
    
    // Check Darshan Gregorian anniversaries
    checkCalendarGreetings();

    // Attach active game manager globally
    window.gameManager = activeGameManager;

    // Configure UI callbacks on activeGameManager
    activeGameManager.onStateChange = (state) => {
        // 1. Update Mode Switcher buttons
        const btnVita = document.getElementById('btn-mode-vita');
        const btnTileClub = document.getElementById('btn-mode-tileclub');
        const btnClassic = document.getElementById('btn-mode-classic');
        const btnRealms = document.getElementById('btn-mode-realms');
        [btnVita, btnTileClub, btnClassic, btnRealms].forEach(b => { if (b) b.classList.remove('active'); });

        if (state.gameplayMode === 'vita' && btnVita) {
            btnVita.classList.add('active');
        } else if (state.gameplayMode === 'tile_club' && btnTileClub) {
            btnTileClub.classList.add('active');
        } else if (state.gameplayMode === 'classic' && btnClassic) {
            btnClassic.classList.add('active');
        } else if (state.gameplayMode === 'realms' && btnRealms) {
            btnRealms.classList.add('active');
        }

        // 2. Tray visibility & floating gameplay prompt
        const trayContainer = document.getElementById('tray-container');
        if (trayContainer) {
            trayContainer.style.display = state.gameplayMode === 'tile_club' ? 'flex' : 'none';
        }

        const promptEl = document.getElementById('gameplay-prompt');
        if (promptEl) {
            const formBadge = state.formationName ? ` · ${state.formationName}` : '';
            if (state.gameplayMode === 'realms') {
                const realmName = state.activeRealm ? state.activeRealm.name : 'Thematic Realm';
                promptEl.innerHTML = `<span>🗺️ ${realmName}${formBadge}</span>`;
            } else if (state.gameplayMode === 'classic') {
                promptEl.innerHTML = `<span>🏛️ Classic Solitaire${formBadge}</span>`;
            } else if (state.gameplayMode === 'vita') {
                promptEl.innerHTML = `<span>✨ Match pairs (2)${formBadge}</span>`;
            } else {
                promptEl.innerHTML = `<span>📥 Collect triads (3)${formBadge}</span>`;
            }
        }

        // 3. Render tray slots for Mode B (Tile Club Triads)
        const trayEl = document.getElementById('tray');
        const trayCounter = document.getElementById('tray-slot-counter');
        const trayGuidance = document.querySelector('.tray-guidance-text');

        if (trayCounter && state.tray) {
            trayCounter.innerText = `${state.tray.length} / 7`;
        }

        if (trayGuidance && state.tray) {
            if (state.tray.length >= 6) {
                trayGuidance.innerHTML = '<span style="color: #ef4444; font-weight: 800;">⚠️ TRAY ALMOST FULL (6/7)! Match 3 quickly!</span>';
            } else if (state.tray.length >= 5) {
                trayGuidance.innerHTML = '<span style="color: #f59e0b; font-weight: 700;">⚠️ 5/7 Slots Filled. Find matching triads!</span>';
            } else {
                trayGuidance.innerText = '📥 Holding Tray: Match 3 identical tiles to dissolve!';
            }
        }

        if (trayEl && state.gameplayMode === 'tile_club') {
            // Count identical flora in tray to highlight pairs
            const floraCounts = {};
            (state.tray || []).forEach(t => {
                const fId = t.floraId || '';
                floraCounts[fId] = (floraCounts[fId] || 0) + 1;
            });

            const slots = trayEl.querySelectorAll('.tray-slot');
            slots.forEach((slot, idx) => {
                slot.innerHTML = '';
                slot.className = 'tray-slot';
                if (state.tray && state.tray[idx]) {
                    const t = state.tray[idx];
                    const f = t.floraData || {};
                    const arch = f.archetype || 'ivory';
                    const countInTray = floraCounts[t.floraId] || 1;
                    const isPairInTray = countInTray === 2;

                    if (isPairInTray) {
                        slot.classList.add('tray-slot-pair-pending');
                    }

                    slot.innerHTML = `
                        <div class="tray-tile archetype-${arch} ${isPairInTray ? 'tray-pair-glow' : ''}"
                             onclick="window.handleReturnTrayTile && window.handleReturnTrayTile('${t.id}')"
                             title="Tap to return this tile to board"
                             role="button"
                             aria-label="${f.commonName || 'Tile'}, tap to return to board">
                            <div class="tray-tile-symbol">${f.symbol || '🪷'}</div>
                            <div class="tray-tile-label">${f.commonName || ''}</div>
                            ${isPairInTray ? '<span class="tray-pair-badge">2/3</span>' : ''}
                        </div>
                    `;
                }
            });
        }

        // 4. Senior View button
        const btnSenior = document.getElementById('btn-toggle-senior');
        const fgSeniorBtn = document.getElementById('fg-senior-btn');
        [btnSenior, fgSeniorBtn].forEach(b => {
            if (b) {
                if (state.seniorView) b.classList.add('active');
                else b.classList.remove('active');
            }
        });

        // 5. Remaining tiles status & HUD bar
        const statusText = document.getElementById('status-text');
        const statusTilesLeft = document.getElementById('status-tiles-left');
        const txt = `Tiles left: ${state.remainingTilesCount}`;
        if (statusText) statusText.innerText = txt;
        if (statusTilesLeft) statusTilesLeft.innerText = txt;

        const rankBadge = document.getElementById('header-rank-badge');
        const levelIndicator = document.getElementById('header-level-indicator');
        const sparksCount = document.getElementById('header-sparks-count');
        const playerNameEl = document.getElementById('header-player-name');

        if (playerNameEl) {
            const playerBadge = document.getElementById('header-player-badge');
            const avatar = state.avatar || '🦉';
            playerNameEl.innerText = state.name || 'Seeker';
            if (playerBadge) {
                playerBadge.innerHTML = `${avatar} <span id="header-player-name">${state.name || 'Seeker'}</span>`;
            }
        }

        const cleanSolveBadge = document.getElementById('header-clean-solve-badge');
        if (cleanSolveBadge) {
            const isClean = (state.hintsUsed === 0);
            if (isClean) {
                cleanSolveBadge.style.opacity = '1';
                cleanSolveBadge.style.filter = 'none';
                cleanSolveBadge.innerText = '✨ Clean Solve';
            } else {
                cleanSolveBadge.style.opacity = '0.45';
                cleanSolveBadge.style.filter = 'grayscale(100%)';
                cleanSolveBadge.innerText = 'Standard Solve';
            }
        }

        if (rankBadge && state.rank) {
            const fullTitle = `${state.rank.symbol} ${state.rank.name}`;
            rankBadge.setAttribute('data-full-title', fullTitle);
            const isNarrow = (window.visualViewport ? window.visualViewport.width : window.innerWidth) < 380;
            rankBadge.innerText = isNarrow ? state.rank.symbol : fullTitle;
        }
        if (levelIndicator) {
            const isNarrow = (window.visualViewport ? window.visualViewport.width : window.innerWidth) < 420;
            const formStr = (!isNarrow && state.formationName) ? ` · ${state.formationName}` : '';
            levelIndicator.innerText = `Level ${state.currentLevel || 1}${formStr}`;
            levelIndicator.title = `Current Level: ${state.currentLevel || 1} (${state.formationName || 'Sanctuary Formation'})`;
        }
        if (sparksCount) {
            sparksCount.innerText = `✨ ${state.sparks || 100}`;
        }
        const scoreCount = document.getElementById('header-score-count');
        if (scoreCount) {
            scoreCount.innerText = `${(state.score || 0).toLocaleString()}`;
        }

        // Action bar Hint badge affordance (dims when < 20 sparks)
        const hintBtnBadge = document.querySelector('#btn-action-hint .action-btn-badge');
        if (hintBtnBadge) {
            if ((state.sparks || 0) < 20) {
                hintBtnBadge.style.opacity = '0.35';
                hintBtnBadge.style.filter = 'grayscale(100%)';
            } else {
                hintBtnBadge.style.opacity = '1';
                hintBtnBadge.style.filter = 'none';
            }
        }

        // Welcome screen personalization for returning users
        const welcomeSub = document.getElementById('welcome-sub');
        const btnBegin = document.getElementById('btn-begin-journey');
        const switchPlayer = document.getElementById('welcome-player-switch');
        const setPlayerInput = document.getElementById('set-player-name');
        const profileBadge = document.getElementById('welcome-profile-badge');
        const badgeAvatar = document.getElementById('welcome-badge-avatar');
        const badgeName = document.getElementById('welcome-badge-name');
        const badgeRank = document.getElementById('welcome-badge-rank');
        const badgeSparks = document.getElementById('welcome-badge-sparks');

        if (state.name) {
            const isReturning = !state.isNewUser && state.currentLevel > 1;
            if (welcomeSub) {
                welcomeSub.innerText = isReturning 
                    ? `Welcome back, ${state.name}! ✨` 
                    : `Welcome, ${state.name}! ✨`;
            }
            if (btnBegin) {
                btnBegin.innerText = isReturning 
                    ? `Continue Level ${state.currentLevel} ➔` 
                    : `Begin Level ${state.currentLevel || 1} ➔`;
            }
            if (switchPlayer) switchPlayer.style.display = 'block';
            if (setPlayerInput) setPlayerInput.value = state.name;

            if (profileBadge && isReturning) {
                profileBadge.style.display = 'inline-flex';
                if (badgeAvatar) badgeAvatar.innerText = state.avatar || '🦉';
                if (badgeName) badgeName.innerText = state.name;
                if (badgeRank && state.rank) badgeRank.innerText = `${state.rank.symbol} ${state.rank.name}`;
                if (badgeSparks) badgeSparks.innerText = `✨ ${state.sparks || 100}`;
            } else if (profileBadge) {
                profileBadge.style.display = 'none';
            }
        } else {
            if (welcomeSub) welcomeSub.innerText = 'General Knowledge Concentration Quest';
            if (btnBegin) btnBegin.innerText = 'Begin Journey ➔';
            if (switchPlayer) switchPlayer.style.display = 'none';
            if (profileBadge) profileBadge.style.display = 'none';
        }

        // 6. Matched Flora Preview (Mode A)
        const matchedList = document.getElementById('matched-flora-list');
        const statusHeading = document.getElementById('status-col-heading');
        if (statusHeading) {
            statusHeading.innerText = state.gameplayMode === 'vita' ? 'Matched Flora (Mode A)' : 'Holding Tray (Mode B)';
        }
        if (matchedList && state.gameplayMode === 'vita') {
            matchedList.innerHTML = '';
            state.matchedPairs.slice(0, 5).forEach(m => {
                const row = document.createElement('div');
                row.style.cssText = 'display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);';
                row.innerHTML = `<span style="font-size: 20px;">${m.flora?.symbol || '💡'}</span><div><div style="font-size: 12px; font-weight: 700; color: #fff;">${m.flora?.commonName || ''}</div><div style="font-size: 10px; color: #ffd700;">${m.flora?.domain || ''}</div></div>`;
                matchedList.appendChild(row);
            });
        }
        // 7. Field Guide Realm Synchronization when no tile is yet matched
        if (!window.currentDiscoveredFlora && state.activeRealm) {
            initFieldGuideForRealm(state.activeRealm);
        }
    };

    window.currentDiscoveredFlora = null;

    function initFieldGuideForRealm(realm) {
        if (!realm) return;
        const fgTitle = document.getElementById('field-guide-title');
        const fgDomainPill = document.getElementById('fg-domain-pill');
        const fgIcon = document.getElementById('fg-icon');
        const fgName = document.getElementById('fg-name');
        const fgBinomial = document.getElementById('fg-binomial');
        const fgFamily = document.getElementById('fg-family');
        const fgRole = document.getElementById('fg-role');
        const fgQuality = document.getElementById('fg-quality');

        if (fgTitle) fgTitle.innerText = 'Knowledge Field Guide';
        if (fgDomainPill) fgDomainPill.innerText = `Chapter ${realm.chapter} · ${realm.name}`;
        if (fgIcon) fgIcon.innerText = realm.icon || '🌲';
        if (fgName) fgName.innerText = realm.name;
        if (fgBinomial) fgBinomial.innerText = realm.subtitle;
        if (fgFamily) fgFamily.innerText = `Sanctuary Realm (${realm.isMasterArtLevel ? 'Master Authentic Art' : 'Classic Mastery'}).`;
        if (fgRole) fgRole.innerText = 'Match unlocked tile pairs to dissolve the board and explore deep knowledge lore.';
        if (fgQuality) fgQuality.innerText = 'Concentration, calmness & cognitive clarity';
    }

    function syncFieldGuideAndCard(flora) {
        if (!flora) return;
        window.currentDiscoveredFlora = flora;

        const isAshramMode = (profileState.settings && profileState.settings.experienceMode === 'ashram_sanctuary');

        // Update Desktop Field Guide (Left Column)
        const fgTitle = document.getElementById('field-guide-title');
        const fgDomainPill = document.getElementById('fg-domain-pill');
        const fgIcon = document.getElementById('fg-icon');
        const fgName = document.getElementById('fg-name');
        const fgBinomial = document.getElementById('fg-binomial');
        const fgFamily = document.getElementById('fg-family');
        const fgRole = document.getElementById('fg-role');
        const fgQuality = document.getElementById('fg-quality');

        if (fgTitle) fgTitle.innerText = isAshramMode ? 'Botanical Field Guide' : 'Knowledge Field Guide';
        if (fgDomainPill) fgDomainPill.innerText = flora.domain || (isAshramMode ? 'Flora & Sanctuary' : 'General Knowledge');
        if (fgIcon) fgIcon.innerText = flora.symbol || '💡';
        if (fgName) fgName.innerText = flora.commonName || '';
        if (fgBinomial) fgBinomial.innerText = flora.domain || 'Knowledge Discipline';
        if (fgFamily) fgFamily.innerText = flora.definition || '';
        if (fgRole) fgRole.innerText = flora.educationalLore || flora.definition || '';
        if (fgQuality) fgQuality.innerText = isAshramMode ? (flora.quality || 'Divine unfoldment') : (flora.domain || 'Core Insight');

        // Update Overlay Wisdom Card (Mobile & Dialogue View)
        const cardIcon = document.getElementById('card-icon');
        const cardTitle = document.getElementById('card-title');
        const cardQuality = document.getElementById('card-quality');
        const cardDesc = document.getElementById('card-desc');
        const cardSabda = document.getElementById('card-sabda');

        if (cardIcon) {
            cardIcon.innerText = flora.symbol || '💡';
            const arch = flora.archetype || 'ivory';
            cardIcon.className = `match-card-icon archetype-${arch}`;
        }
        if (cardTitle) cardTitle.innerText = flora.commonName || '';
        if (cardQuality) cardQuality.innerText = flora.domain || (isAshramMode ? 'Sacred Sanctuary' : 'General Knowledge');
        if (cardDesc) {
            cardDesc.innerText = flora.educationalLore || flora.definition || 'A captivating concept in human knowledge and nature.';
        }
        if (cardSabda) {
            if (isAshramMode) {
                cardSabda.innerText = 'Explore Sacred Ashram Archives ↗';
                cardSabda.href = 'https://www.sriaurobindoashram.org/';
            } else {
                cardSabda.innerText = `Explore ${flora.commonName || 'Concept'} on Wikipedia ↗`;
                cardSabda.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(flora.commonName || '')}`;
            }
        }
    }

    activeGameManager.onMatchSuccess = ({ mode, flora }) => {
        syncFieldGuideAndCard(flora);
    };

    activeGameManager.onStageComplete = (info) => {
        const modal = document.getElementById('stage-clear-modal');
        if (!modal) return;

        const vTitle = document.getElementById('victory-title');
        const vSubtitle = document.getElementById('victory-subtitle');
        const vSparks = document.getElementById('victory-sparks');
        const vBonusText = document.getElementById('victory-bonus-text');
        const vRankUp = document.getElementById('victory-rank-up');

        if (vTitle) vTitle.innerText = info.isMilestone ? `🌟 Milestone Level ${info.completedLevel} Cleared!` : `Level ${info.completedLevel} Cleared!`;
        if (vSubtitle) vSubtitle.innerText = `${info.newRank.symbol} ${info.newRank.name} · Next: Level ${info.nextLevel}`;
        if (vSparks) vSparks.innerText = `+${info.earnedSparks} ✨`;
        if (vBonusText) {
            let bonusStr = info.cleanSolve ? 'Clean Solve +5 ✨' : 'Standard Clear';
            if (info.isMilestone) bonusStr += ' · Sanctuary Milestone +20 ✨';
            vBonusText.innerText = bonusStr;
        }

        if (vRankUp) {
            if (info.rankPromoted) {
                vRankUp.style.display = 'block';
                vRankUp.innerText = `Promoted to ${info.newRank.symbol} ${info.newRank.name}! +50 Sparks 💫`;
            } else {
                vRankUp.style.display = 'none';
            }
        }

        playAshramMeditationGong();
        modal.classList.add('active');
    };

    activeGameManager.onGameOver = ({ reason }) => {
        if (reason === 'GAME_OVER_TRAY_OVERFLOW') {
            const modal = document.getElementById('tray-overflow-modal');
            if (modal) modal.style.display = 'flex';
        }
    };

    // Global Modal Keyboard Interceptions (Enter, Space, Escape)
    window.addEventListener('keydown', (e) => {
        const stageModal = document.getElementById('stage-clear-modal');
        if (stageModal && stageModal.classList.contains('active')) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.nextLevelStage();
                return;
            }
        }

        const nameModal = document.getElementById('name-entry-modal');
        if (nameModal && nameModal.style.display === 'flex') {
            if (e.key === 'Escape') {
                e.preventDefault();
                window.closeNameModal();
                return;
            }
        }

        const trayModal = document.getElementById('tray-overflow-modal');
        if (trayModal && trayModal.style.display === 'flex') {
            if (e.key === 'Escape') {
                e.preventDefault();
                window.handleTrayFreeUndo();
                return;
            }
        }

        const matchOverlay = document.getElementById('match-overlay');
        if (matchOverlay && matchOverlay.style.display === 'flex') {
            if (e.key === 'Escape' || e.key === 'Enter') {
                e.preventDefault();
                window.closeMatchCard();
                return;
            }
        }

        const onboardingModal = document.getElementById('onboarding-modal');
        if (onboardingModal && onboardingModal.classList.contains('active')) {
            if (e.key === 'Escape') {
                e.preventDefault();
                onboardingModal.classList.remove('active');
                return;
            }
        }

        const glossaryModal = document.getElementById('glossary-modal');
        if (glossaryModal && glossaryModal.classList.contains('active')) {
            if (e.key === 'Escape') {
                e.preventDefault();
                glossaryModal.classList.remove('active');
                return;
            }
        }

        const darshanModal = document.getElementById('darshan-modal');
        if (darshanModal && darshanModal.style.display === 'flex') {
            if (e.key === 'Escape' || e.key === 'Enter') {
                e.preventDefault();
                darshanModal.style.display = 'none';
                return;
            }
        }
    });

    window.handleTrayFreeUndo = () => {
        const modal = document.getElementById('tray-overflow-modal');
        if (modal) modal.style.display = 'none';
        // Free undo: pop the last 2 tiles from the tray back to the board
        if (activeGameManager) {
            activeGameManager.undo();
            activeGameManager.undo();
            window.showToastMessage("↩️ Last 2 tiles returned to the board.");
        }
    };

    window.handleTrayRestartStage = () => {
        const modal = document.getElementById('tray-overflow-modal');
        if (modal) modal.style.display = 'none';
        if (activeGameManager) {
            activeGameManager.restartStage();
            window.showToastMessage("🔄 Level refreshed.");
        }
    };

    window.handleReturnTrayTile = (tileId) => {
        if (activeGameManager) {
            activeGameManager.returnTrayTileToBoard(tileId);
            window.showToastMessage("↩️ Tile returned to board.");
        }
    };

    // Initial state push for returning player welcome greeting & HUD sync
    activeGameManager.notifyState();

    window.switchGameplayMode = (mode) => {
        if (mode === 'realms') {
            activeGameManager.setGameplayMode('realms');
            window.showToastMessage("🗺️ 13 Thematic Realms: 195 Levels with Dedicated 3D Artistic Tiles & Environmental Backdrops!");
            window.openRealmsBrowser();
            return;
        }
        if (mode === 'classic') {
            activeGameManager.setGameplayMode('classic');
            window.showToastMessage("🏛️ Classic Campaign: 200 progressive architectural puzzles with educational flora!");
            return;
        }
        activeGameManager.setGameplayMode(mode);
        if (mode === 'vita') {
            window.showToastMessage("🪷 Pairs: Click 2 matching free tiles on the board to dissolve them directly!");
        } else {
            window.showToastMessage("📥 Tile Club: Collect 3 identical tiles into the holding tray to clear!");
        }
    };

    window.openRealmsBrowser = () => {
        const modal = document.getElementById('realms-browser-modal');
        const container = document.getElementById('realms-grid-container');
        if (!modal || !container) return;

        const realms = ThemeManager.getAllRealms();
        const currentLvl = activeGameManager.player.currentLevel || 1;
        const currentRealm = ThemeManager.getRealmForLevel(currentLvl);

        container.innerHTML = realms.map(r => {
            const isActive = (r.id === currentRealm.id);
            return `
                <div class="realm-card-item ${isActive ? 'active' : ''}">
                    <div class="realm-card-icon">${r.icon}</div>
                    <div class="realm-card-chapter">Chapter ${r.chapter}</div>
                    <div class="realm-card-title">${r.name}</div>
                    <div class="realm-card-levels" style="margin-bottom: 8px; font-size: 11px; color: #c5a880;">15 Thematic Levels</div>
                    <button class="c-btn" onclick="window.selectRealm('${r.id}', ${r.levelStart})" style="padding: 6px 8px; font-size: 11px; width: 100%; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; font-weight: 700; border-radius: 8px;">
                        ▶ Enter Realm
                    </button>
                </div>
            `;
        }).join('');

        modal.classList.add('active');
    };

    window.closeRealmsBrowser = () => {
        const modal = document.getElementById('realms-browser-modal');
        if (modal) modal.classList.remove('active');
    };

    window.selectRealm = (realmId, startLevel) => {
        window.closeRealmsBrowser();
        activeGameManager.loadLevel(startLevel);
        window.showToastMessage(`🗺️ Entered Chapter ${realmId}: Level ${startLevel}`);
    };

    window.handleShuffleBoard = () => {
        if (activeGameManager) {
            activeGameManager.reshuffleRemaining();
            window.showToastMessage("🔀 Active tiles reshuffled!");
        }
    };

    window.toggleSeniorViewMode = () => {
        activeGameManager.toggleSeniorView();
    };

    window.setTuningBase = (baseFreq) => {
        activeGameManager.setTuning(baseFreq);
        const b432 = document.getElementById('btn-tune-432');
        const b440 = document.getElementById('btn-tune-440');
        const bOff = document.getElementById('btn-tune-off');
        if (b432) b432.classList.toggle('active', baseFreq === 432);
        if (b440) b440.classList.toggle('active', baseFreq === 440);
        if (bOff) bOff.classList.toggle('active', baseFreq === 'off' || baseFreq === 0 || baseFreq === 'disable');
    };
    
    window.handleBeginJourneyClick = () => {
        if (!activeGameManager.player.name) {
            window.openNameModal();
        } else {
            window.beginDirectJourney();
            const rank = activeGameManager.getRank();
            window.showToastMessage(`✨ Welcome back, ${activeGameManager.player.name}! Continuing at Level ${activeGameManager.player.currentLevel} (${rank.symbol} ${rank.name})`);
        }
    };

    window.openNameModal = () => {
        const modal = document.getElementById('name-entry-modal');
        const input = document.getElementById('player-name-input');
        if (input) input.value = activeGameManager.player.name || '';

        // Populate saved profiles list if any exist
        const section = document.getElementById('saved-profiles-section');
        const list = document.getElementById('saved-profiles-list');
        if (section && list && activeGameManager.loadProfilesMap) {
            const profiles = activeGameManager.loadProfilesMap();
            const names = Object.keys(profiles);
            if (names.length > 0) {
                section.style.display = 'block';
                list.innerHTML = '';
                names.forEach(name => {
                    const prof = profiles[name];
                    const av = prof.avatar || '🦉';
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'saved-profile-pill';
                    btn.style.cssText = 'background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 4px 10px; border-radius: 14px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px;';
                    if (name === activeGameManager.player.name) {
                        btn.style.borderColor = '#ffd700';
                        btn.style.background = 'rgba(255,215,0,0.18)';
                    }
                    btn.innerHTML = `${av} <strong>${name}</strong> <span style="opacity:0.75; font-size: 10px;">· Lvl ${prof.currentLevel || 1}</span>`;
                    btn.onclick = () => {
                        if (input) input.value = name;
                        window.selectAvatar(av);
                    };
                    list.appendChild(btn);
                });
            } else {
                section.style.display = 'none';
            }
        }

        if (modal) modal.style.display = 'flex';
        if (input) setTimeout(() => input.focus(), 100);
    };

    window.closeNameModal = () => {
        const modal = document.getElementById('name-entry-modal');
        if (modal) modal.style.display = 'none';
    };

    let activeSelectedAvatar = '🦉';
    window.selectAvatar = (avatarSymbol) => {
        activeSelectedAvatar = avatarSymbol;
        const pills = document.querySelectorAll('.avatar-pill');
        pills.forEach(p => {
            if (p.getAttribute('data-avatar') === avatarSymbol) {
                p.style.borderColor = '#ffd700';
                p.style.background = 'rgba(255,215,0,0.2)';
            } else {
                p.style.borderColor = 'rgba(255,255,255,0.2)';
                p.style.background = 'rgba(255,255,255,0.06)';
            }
        });
    };

    window.submitPlayerName = () => {
        const input = document.getElementById('player-name-input');
        const enteredName = (input ? input.value : '').trim() || 'Seeker';
        const profile = activeGameManager.switchPlayer(enteredName, activeSelectedAvatar);
        window.closeNameModal();

        const rank = activeGameManager.getRank();
        if (profile.isNewUser) {
            window.showToastMessage(`✨ Welcome, ${activeSelectedAvatar} ${enteredName}! New profile ready at Level 1`);
        } else {
            window.showToastMessage(`✨ Welcome back, ${activeSelectedAvatar} ${enteredName}! Resuming Level ${profile.currentLevel} (${rank.symbol} ${rank.name})`);
        }
    };

    window.updatePlayerNameFromSettings = () => {
        const input = document.getElementById('set-player-name');
        if (!input) return;
        const entered = input.value.trim() || 'Seeker';
        activeGameManager.renamePlayer(entered);
        window.showToastMessage(`Seeker name updated to ${entered}`);
    };

    // Zero-Gate Entry: Direct Jump into Level 1 or Saved Level (or 15 Gardens in V2)
    window.beginDirectJourney = () => {
        initAudioEngine(profileState.settings.volumeRaga, profileState.settings.volumeGong);
        const expMode = profileState.settings.experienceMode || 'gk_quest';
        if (expMode === 'ashram_sanctuary') {
            routeToScreen('selector');
        } else {
            routeToScreen('game');
            if (!activeGameManager.boardRenderer) {
                activeGameManager.init('board', 'center-stage-col');
            } else {
                activeGameManager.startNewStage(activeGameManager.player.currentLevel);
            }
        }
    };

    window.nextLevelStage = () => {
        const modal = document.getElementById('stage-clear-modal');
        if (modal) modal.classList.remove('active');
        activeGameManager.nextLevel();
    };

    window.showToastMessage = (msg) => {
        const toast = document.getElementById('toast-banner');
        if (!toast) return;
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2400);
    };

    // Map window-global click hooks for dynamic index views
    window.openOnboarding = () => {
        initAudioEngine(profileState.settings.volumeRaga, profileState.settings.volumeGong);
        window.handleBeginJourneyClick();
    };
    
    window.selectPath = (path) => {
        updateSanctuaryMode(path);
        const modal = document.getElementById('onboarding-modal');
        if (modal) modal.classList.remove('active');
        applySanctuaryModeTheme();
        window.beginDirectJourney();
    };
    
    window.navTo = (screenId) => {
        routeToScreen(screenId);
        if (screenId === 'game' && !activeGameManager.boardRenderer) {
            activeGameManager.init('board', 'center-stage-col');
        }
    };
    
    window.backToSelector = () => {
        routeToScreen('welcome');
    };
    
    window.backToWelcome = () => {
        routeToScreen('welcome');
    };
    
    window.backFromSettings = () => {
        const prev = getPreviousScreen();
        let targetScreen = prev;
        if (!targetScreen || targetScreen === 'settings' || targetScreen === 'selector') {
            targetScreen = (activeGameManager && activeGameManager.tiles.length > 0) ? 'game' : 'welcome';
        }
        routeToScreen(targetScreen);
    };

    window.reshuffleBoard = () => {
        activeGameManager.restartStage();
    };

    window.closeMatchCard = () => {
        stopSpeechSynthesis();
        const card = document.getElementById('match-overlay');
        if (card) card.style.display = 'none';
    };

    window.openLoreCard = () => {
        if (!window.currentDiscoveredFlora) {
            window.showToastMessage("💡 Match any pair or triad first to reveal its Field Guide entry!");
            return;
        }
        const card = document.getElementById('match-overlay');
        if (card) card.style.display = 'flex';
    };

    window.playFieldGuideTTS = () => {
        if (!window.currentDiscoveredFlora) {
            window.showToastMessage("Match a tile to explore its lore!");
            return;
        }
        const flora = window.currentDiscoveredFlora;
        const text = `${flora.commonName}. ${flora.domain || ''}. ${flora.educationalLore || flora.definition || ''}`;
        speakCustomSpeech(text);
    };

    window.playTTS = () => {
        playMeditativeSpeech();
    };

    window.stopTTS = () => {
        stopSpeechSynthesis();
    };

    window.drawDailyOracle = () => {
        drawDailyOracle();
    };

    window.triggerConsecration = () => {
        const input = document.getElementById('reflection-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        
        playAshramMeditationGong();
        
        const canvas = document.getElementById('jar-canvas');
        const jarSvg = document.getElementById('brass-jar');
        if (jarSvg) jarSvg.classList.add('glow');
        
        const jarX = canvas.width / 2;
        const jarY = canvas.height - 70;
        
        triggerReflectionDissolve('jar-canvas', text, jarX, jarY, () => {
            if (jarSvg) jarSvg.classList.remove('glow');
            profileState.reflections.push({
                entry_id: Math.random().toString(),
                timestamp: new Date().toISOString(),
                input_text: text,
                status: "consecrated"
            });
            profileState.profile.lotusPetalCount += 2;
            saveProfileState();
            input.value = "";
            window.showToastMessage("🏺 Reflections surrendered into the Consecration Jar.");
            routeToScreen('welcome');
        });
    };

    // Settings bindings & state sync
    const expSelect = document.getElementById('set-experience-mode');
    if (expSelect) {
        expSelect.value = profileState.settings.experienceMode || 'gk_quest';
    }

    const ragaSlider = document.getElementById('raga-vol');
    const gongSlider = document.getElementById('gong-vol');
    const ragaBadge = document.getElementById('raga-vol-val');
    const gongBadge = document.getElementById('gong-vol-val');
    const voiceSelect = document.getElementById('voice-accent');
    const secularToggle = document.getElementById('set-secular-toggle');

    if (ragaSlider && profileState.settings.volumeRaga !== undefined) {
        ragaSlider.value = profileState.settings.volumeRaga;
        if (ragaBadge) ragaBadge.innerText = `${Math.round(profileState.settings.volumeRaga * 100)}%`;
    }
    if (gongSlider && profileState.settings.volumeGong !== undefined) {
        gongSlider.value = profileState.settings.volumeGong;
        if (gongBadge) gongBadge.innerText = `${Math.round(profileState.settings.volumeGong * 100)}%`;
    }
    if (voiceSelect && profileState.profile && profileState.profile.voiceTonePreference) {
        voiceSelect.value = profileState.profile.voiceTonePreference;
    }
    if (secularToggle && profileState.settings.secularToggle !== undefined) {
        secularToggle.checked = profileState.settings.secularToggle;
    }

    window.changeExperienceModeSetting = () => {
        const val = document.getElementById('set-experience-mode').value;
        updateExperienceMode(val);
        if (val === 'ashram_sanctuary') {
            window.showToastMessage("🪷 V2 Ashram Sanctuary mode activated. 15 Sacred Gardens available!");
        } else {
            window.showToastMessage("🌟 V1 General Knowledge Quest activated (520 Levels).");
        }
    };

    window.changePathSetting = () => {
        const val = document.getElementById('set-path-select').value;
        updateSanctuaryMode(val);
        applySanctuaryModeTheme();
    };

    window.toggleSecularMode = () => {
        const chk = document.getElementById('set-secular-toggle').checked;
        toggleSecularTerminology(chk);
    };

    window.changeVolume = (type) => {
        const slider = document.getElementById(type === 'raga' ? 'raga-vol' : 'gong-vol');
        if (slider) {
            updateVolumeSetting(type, parseFloat(slider.value));
            const valBadge = document.getElementById(type === 'raga' ? 'raga-vol-val' : 'gong-vol-val');
            if (valBadge) {
                valBadge.innerText = `${Math.round(parseFloat(slider.value) * 100)}%`;
            }
        }
    };

    window.changeVoiceSetting = () => {
        const val = document.getElementById('voice-accent').value;
        updateVoicePreference(val);
    };

    window.exportProfileData = async () => {
        const pwInput = document.getElementById('backup-pw');
        if (!pwInput || !pwInput.value) {
            window.showToastMessage("⚠️ Please enter a password to encrypt backup.");
            return;
        }
        try {
            const backupStr = await encryptAndExportBackup(pwInput.value);
            const blob = new Blob([backupStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "auro_match_backup.json";
            a.click();
            pwInput.value = "";
            window.showToastMessage("✅ Encrypted backup exported successfully!");
        } catch(e) {
            console.error("Encryption failed:", e);
            window.showToastMessage("❌ Backup encryption failed.");
        }
    };

    window.importProfileData = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const pwInput = document.getElementById('backup-pw');
        if (!pwInput || !pwInput.value) {
            window.showToastMessage("⚠️ Please enter decryption password first.");
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await decryptAndImportBackup(pwInput.value, e.target.result);
                window.showToastMessage("✅ Backup restored! Reloading...");
                pwInput.value = "";
                setTimeout(() => window.location.reload(), 800);
            } catch(err) {
                console.error("Decryption failed:", err);
                window.showToastMessage("❌ Incorrect password or corrupt backup file.");
            }
        };
        reader.readAsText(file);
    };

    window.triggerPurgeReset = () => {
        const val = prompt("Type 'PURGE' verbatim to drop keys and reset the application storage:");
        if (val === 'PURGE') {
            executeAbsolutePurge();
            window.showToastMessage("All keys dropped. Reloading...");
            setTimeout(() => window.location.reload(), 600);
        } else {
            window.showToastMessage("Purge action cancelled.");
        }
    };

    // Glossary sheets click interception
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('glossary-term')) {
            const term = e.target.getAttribute('data-glossary');
            openGlossaryOverlaySheet(term, 'glossary-modal', 'glossary-title', 'glossary-desc');
        }
    });

    // Backdrop dismissal for auxiliary overlays
    ['glossary-modal', 'onboarding-modal', 'darshan-modal'].forEach((modalId) => {
        const el = document.getElementById(modalId);
        if (el) {
            el.addEventListener('click', (e) => {
                if (e.target === el) {
                    if (el.classList.contains('active')) {
                        el.classList.remove('active');
                    } else if (el.style.display === 'flex') {
                        el.style.display = 'none';
                    }
                }
            });
        }
    });

    // Auto-setup of audio on welcome view tap
    document.body.addEventListener('click', () => {
        initAudioEngine(profileState.settings.volumeRaga, profileState.settings.volumeGong);
    }, { once: true });

    // Dynamic Screen Adjustment & Viewport Metrics Engine (Vak-style)
    function initDynamicScreenAdjuster() {
        let resizeThrottle = null;

        function updateViewportMetrics() {
            const vp = window.visualViewport;
            const currentVh = vp ? vp.height : window.innerHeight;
            const currentVw = vp ? vp.width : window.innerWidth;
            document.documentElement.style.setProperty('--app-height', `${Math.round(currentVh)}px`);

            // Narrow mobile screens (< 380px) dynamic rank title fit
            const rankBadge = document.getElementById('header-rank-badge');
            if (rankBadge) {
                const fullTitle = rankBadge.getAttribute('data-full-title') || rankBadge.textContent;
                if (!rankBadge.getAttribute('data-full-title')) rankBadge.setAttribute('data-full-title', fullTitle);
                if (currentVw < 380) {
                    const iconMatch = fullTitle.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\p{Emoji}/u);
                    rankBadge.textContent = iconMatch ? iconMatch[0] : '🌱';
                } else {
                    rankBadge.textContent = fullTitle;
                }
            }

            // Re-render board with updated responsive bounds if active
            if (activeGameManager && activeGameManager.boardRenderer) {
                activeGameManager.boardRenderer.render();
            }
        }

        window.updateDynamicViewportMetrics = () => {
            if (resizeThrottle) cancelAnimationFrame(resizeThrottle);
            resizeThrottle = requestAnimationFrame(() => {
                updateViewportMetrics();
                resizeThrottle = null;
            });
        };

        window.addEventListener('resize', window.updateDynamicViewportMetrics, { passive: true });
        window.addEventListener('orientationchange', () => {
            setTimeout(window.updateDynamicViewportMetrics, 150);
        }, { passive: true });

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', window.updateDynamicViewportMetrics, { passive: true });
        }

        requestAnimationFrame(updateViewportMetrics);
    }

    initDynamicScreenAdjuster();
});
