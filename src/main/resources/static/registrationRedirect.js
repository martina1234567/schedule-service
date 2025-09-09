 /**
         * ПРОСТ REGISTRATION REDIRECT SCRIPT
         * Добави този код в края на index.html преди </body>
         */
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔧 Setting up Registration button redirect...');

            // Чакаме малко да се заредят всички елементи
            setTimeout(function() {
                const registerBtn = document.getElementById('register-btn');

                if (registerBtn) {
                    console.log('✅ Found registration button');

                    // Добавяме event listener за кликване
                    registerBtn.addEventListener('click', function(event) {
                        event.preventDefault();
                        event.stopPropagation();

                        console.log('🆕 Registration button clicked - redirecting...');

                        // Показваме loading състояние
                        const originalHTML = registerBtn.innerHTML;
                        registerBtn.innerHTML = `
                            <span class="register-icon">⏳</span>
                            <span class="button-text">Зарежда...</span>
                        `;
                        registerBtn.disabled = true;
                        registerBtn.style.opacity = '0.7';

                        // Редиректваме след кратка пауза
                        setTimeout(function() {
                            console.log('🔄 Redirecting to registration page...');
                            window.location.href = 'http://localhost:8080/registration.html';
                        }, 600);
                    });

                    console.log('✅ Registration button configured successfully');

                } else {
                    console.error('❌ Registration button NOT FOUND!');

                    // Debug информация
                    console.log('🔍 Available buttons on page:');
                    document.querySelectorAll('button').forEach(function(btn, index) {
                        console.log(`Button ${index + 1}:`, {
                            id: btn.id || 'no-id',
                            class: btn.className || 'no-class',
                            text: btn.textContent?.trim().slice(0, 30) || 'no-text'
                        });
                    });
                }
            }, 1000); // Чакаме 1 секунда да се заредят всички елементи
        });