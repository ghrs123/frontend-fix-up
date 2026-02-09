-- Seed file for base vocabulary
-- Run this file to populate the base_vocabulary table with example data

INSERT INTO base_vocabulary (word, translation, definition, pronunciation, example_sentence, example_translation, category, difficulty) VALUES
-- Basic Greetings (Beginner)
('hello', 'olá', 'A greeting used when meeting someone', '/həˈloʊ/', 'Hello, how are you?', 'Olá, como estás?', 'Greetings', 'beginner'),
('goodbye', 'adeus', 'A parting phrase used when leaving', '/ɡʊdˈbaɪ/', 'Goodbye, see you tomorrow!', 'Adeus, vemo-nos amanhã!', 'Greetings', 'beginner'),
('please', 'por favor', 'A polite word used when making a request', '/pliːz/', 'Please help me with this.', 'Por favor ajuda-me com isto.', 'Greetings', 'beginner'),
('thank you', 'obrigado/a', 'An expression of gratitude', '/θæŋk juː/', 'Thank you for your help.', 'Obrigado pela tua ajuda.', 'Greetings', 'beginner'),
('sorry', 'desculpa', 'An expression of apology', '/ˈsɒri/', 'Sorry, I didn''t mean to.', 'Desculpa, não foi de propósito.', 'Greetings', 'beginner'),

-- Common Verbs (Beginner)
('to be', 'ser/estar', 'To exist or have a quality', '/tuː biː/', 'I am happy today.', 'Estou feliz hoje.', 'Verbs', 'beginner'),
('to have', 'ter', 'To possess or own', '/tuː hæv/', 'I have a new car.', 'Tenho um carro novo.', 'Verbs', 'beginner'),
('to do', 'fazer', 'To perform an action', '/tuː duː/', 'What do you do for work?', 'O que fazes de trabalho?', 'Verbs', 'beginner'),
('to go', 'ir', 'To move from one place to another', '/tuː ɡoʊ/', 'I go to school every day.', 'Vou à escola todos os dias.', 'Verbs', 'beginner'),
('to say', 'dizer', 'To express in words', '/tuː seɪ/', 'What did you say?', 'O que disseste?', 'Verbs', 'beginner'),
('to get', 'obter/conseguir', 'To receive or obtain', '/tuː ɡet/', 'I need to get some milk.', 'Preciso de ir buscar leite.', 'Verbs', 'beginner'),
('to make', 'fazer/criar', 'To create or produce', '/tuː meɪk/', 'I make breakfast every morning.', 'Faço o pequeno-almoço todas as manhãs.', 'Verbs', 'beginner'),
('to know', 'saber/conhecer', 'To have information or be familiar with', '/tuː noʊ/', 'I know the answer.', 'Sei a resposta.', 'Verbs', 'beginner'),
('to think', 'pensar', 'To use your mind to consider', '/tuː θɪŋk/', 'I think it''s a good idea.', 'Acho que é uma boa ideia.', 'Verbs', 'beginner'),
('to take', 'levar/tomar', 'To get hold of or carry', '/tuː teɪk/', 'Take your umbrella.', 'Leva o teu guarda-chuva.', 'Verbs', 'beginner'),

-- Numbers (Beginner)
('one', 'um', 'The number 1', '/wʌn/', 'I have one brother.', 'Tenho um irmão.', 'Numbers', 'beginner'),
('two', 'dois', 'The number 2', '/tuː/', 'I have two sisters.', 'Tenho duas irmãs.', 'Numbers', 'beginner'),
('three', 'três', 'The number 3', '/θriː/', 'Three is a magic number.', 'Três é um número mágico.', 'Numbers', 'beginner'),
('ten', 'dez', 'The number 10', '/ten/', 'I have ten fingers.', 'Tenho dez dedos.', 'Numbers', 'beginner'),
('hundred', 'cem', 'The number 100', '/ˈhʌndrəd/', 'There are a hundred people here.', 'Há cem pessoas aqui.', 'Numbers', 'beginner'),

-- Time (Beginner)
('today', 'hoje', 'This present day', '/təˈdeɪ/', 'Today is Monday.', 'Hoje é segunda-feira.', 'Time', 'beginner'),
('tomorrow', 'amanhã', 'The day after today', '/təˈmɒroʊ/', 'I''ll see you tomorrow.', 'Vejo-te amanhã.', 'Time', 'beginner'),
('yesterday', 'ontem', 'The day before today', '/ˈjestərdeɪ/', 'I saw her yesterday.', 'Vi-a ontem.', 'Time', 'beginner'),
('now', 'agora', 'At the present time', '/naʊ/', 'I need it now.', 'Preciso disso agora.', 'Time', 'beginner'),
('later', 'mais tarde', 'At a time in the future', '/ˈleɪtər/', 'I''ll call you later.', 'Ligo-te mais tarde.', 'Time', 'beginner'),

-- Food (Beginner)
('water', 'água', 'A clear liquid essential for life', '/ˈwɔːtər/', 'I drink water every day.', 'Bebo água todos os dias.', 'Food', 'beginner'),
('bread', 'pão', 'A food made from flour', '/bred/', 'I had bread for breakfast.', 'Comi pão ao pequeno-almoço.', 'Food', 'beginner'),
('coffee', 'café', 'A hot drink made from coffee beans', '/ˈkɒfi/', 'I love drinking coffee.', 'Adoro beber café.', 'Food', 'beginner'),
('rice', 'arroz', 'A grain that is a staple food', '/raɪs/', 'We eat rice with dinner.', 'Comemos arroz ao jantar.', 'Food', 'beginner'),
('chicken', 'frango', 'A type of poultry', '/ˈtʃɪkɪn/', 'I''m cooking chicken tonight.', 'Vou cozinhar frango hoje à noite.', 'Food', 'beginner'),

-- Intermediate Vocabulary
('although', 'embora', 'Despite the fact that', '/ɔːlˈðoʊ/', 'Although it was raining, we went out.', 'Embora estivesse a chover, saímos.', 'Conjunctions', 'intermediate'),
('however', 'no entanto', 'But, nevertheless', '/haʊˈevər/', 'I wanted to go; however, I was tired.', 'Queria ir; no entanto, estava cansado.', 'Conjunctions', 'intermediate'),
('therefore', 'portanto', 'For that reason', '/ˈðerfɔːr/', 'He was sick, therefore he stayed home.', 'Estava doente, portanto ficou em casa.', 'Conjunctions', 'intermediate'),
('meanwhile', 'entretanto', 'At the same time', '/ˈmiːnwaɪl/', 'Cook the pasta. Meanwhile, make the sauce.', 'Cozinha a massa. Entretanto, faz o molho.', 'Conjunctions', 'intermediate'),
('otherwise', 'caso contrário', 'Or else; if not', '/ˈʌðərwaɪz/', 'Hurry up, otherwise we''ll be late.', 'Despacha-te, caso contrário vamos chegar atrasados.', 'Conjunctions', 'intermediate'),

('achieve', 'alcançar', 'To successfully reach a goal', '/əˈtʃiːv/', 'She achieved her dream of becoming a doctor.', 'Ela alcançou o seu sonho de se tornar médica.', 'Verbs', 'intermediate'),
('consider', 'considerar', 'To think about carefully', '/kənˈsɪdər/', 'Please consider my suggestion.', 'Por favor considera a minha sugestão.', 'Verbs', 'intermediate'),
('establish', 'estabelecer', 'To set up or create', '/ɪˈstæblɪʃ/', 'They established a new company.', 'Eles estabeleceram uma nova empresa.', 'Verbs', 'intermediate'),
('improve', 'melhorar', 'To make or become better', '/ɪmˈpruːv/', 'I want to improve my English.', 'Quero melhorar o meu inglês.', 'Verbs', 'intermediate'),
('require', 'exigir/requerer', 'To need or demand', '/rɪˈkwaɪər/', 'This job requires experience.', 'Este trabalho exige experiência.', 'Verbs', 'intermediate'),

('opportunity', 'oportunidade', 'A favorable circumstance', '/ˌɒpərˈtuːnəti/', 'This is a great opportunity.', 'Esta é uma grande oportunidade.', 'Nouns', 'intermediate'),
('experience', 'experiência', 'Knowledge from doing something', '/ɪkˈspɪriəns/', 'I have five years of experience.', 'Tenho cinco anos de experiência.', 'Nouns', 'intermediate'),
('decision', 'decisão', 'A choice or conclusion', '/dɪˈsɪʒən/', 'It was a difficult decision.', 'Foi uma decisão difícil.', 'Nouns', 'intermediate'),
('environment', 'ambiente', 'The surroundings or conditions', '/ɪnˈvaɪrənmənt/', 'We must protect the environment.', 'Devemos proteger o ambiente.', 'Nouns', 'intermediate'),
('development', 'desenvolvimento', 'Growth or progress', '/dɪˈveləpmənt/', 'Economic development is important.', 'O desenvolvimento económico é importante.', 'Nouns', 'intermediate'),

-- Advanced Vocabulary
('albeit', 'embora/ainda que', 'Although; even though', '/ɔːlˈbiːɪt/', 'He accepted, albeit reluctantly.', 'Ele aceitou, ainda que relutantemente.', 'Conjunctions', 'advanced'),
('notwithstanding', 'não obstante', 'In spite of; nevertheless', '/ˌnɒtwɪθˈstændɪŋ/', 'Notwithstanding the difficulties, we succeeded.', 'Não obstante as dificuldades, tivemos sucesso.', 'Conjunctions', 'advanced'),
('whereby', 'pelo qual', 'By which; through which', '/weərˈbaɪ/', 'A system whereby everyone benefits.', 'Um sistema pelo qual todos beneficiam.', 'Conjunctions', 'advanced'),
('hitherto', 'até agora', 'Until now; previously', '/ˌhɪðərˈtuː/', 'Hitherto unknown species were discovered.', 'Espécies até agora desconhecidas foram descobertas.', 'Adverbs', 'advanced'),
('nonetheless', 'apesar disso', 'In spite of that; however', '/ˌnʌnðəˈles/', 'It was risky; nonetheless, we proceeded.', 'Era arriscado; apesar disso, prosseguimos.', 'Conjunctions', 'advanced'),

('exacerbate', 'exacerbar', 'To make worse or more severe', '/ɪɡˈzæsərbeɪt/', 'The drought exacerbated the food crisis.', 'A seca exacerbou a crise alimentar.', 'Verbs', 'advanced'),
('ameliorate', 'melhorar/amenizar', 'To make something better', '/əˈmiːliəreɪt/', 'Measures to ameliorate the situation.', 'Medidas para amenizar a situação.', 'Verbs', 'advanced'),
('corroborate', 'corroborar', 'To confirm or support', '/kəˈrɒbəreɪt/', 'Evidence to corroborate his story.', 'Provas para corroborar a sua história.', 'Verbs', 'advanced'),
('delineate', 'delinear', 'To describe or portray precisely', '/dɪˈlɪnieɪt/', 'The report delineates the key issues.', 'O relatório delineia as questões-chave.', 'Verbs', 'advanced'),
('perpetuate', 'perpetuar', 'To cause to continue indefinitely', '/pərˈpetʃueɪt/', 'Stereotypes that perpetuate inequality.', 'Estereótipos que perpetuam a desigualdade.', 'Verbs', 'advanced'),

('paradigm', 'paradigma', 'A typical example or model', '/ˈpærədaɪm/', 'A new paradigm in education.', 'Um novo paradigma na educação.', 'Nouns', 'advanced'),
('dichotomy', 'dicotomia', 'A division into two contrasting parts', '/daɪˈkɒtəmi/', 'The dichotomy between theory and practice.', 'A dicotomia entre teoria e prática.', 'Nouns', 'advanced'),
('proliferation', 'proliferação', 'Rapid increase or spread', '/prəˌlɪfəˈreɪʃən/', 'The proliferation of social media platforms.', 'A proliferação de plataformas de redes sociais.', 'Nouns', 'advanced'),
('ramification', 'ramificação', 'A consequence or implication', '/ˌræmɪfɪˈkeɪʃən/', 'The ramifications of this decision are serious.', 'As ramificações desta decisão são sérias.', 'Nouns', 'advanced'),
('synthesis', 'síntese', 'The combination of ideas into a whole', '/ˈsɪnθəsɪs/', 'A synthesis of different approaches.', 'Uma síntese de diferentes abordagens.', 'Nouns', 'advanced')
ON CONFLICT DO NOTHING;
