INSERT INTO courses
    VALUES ('meic-a', 'MEIC-A', 'mestrado engenharia informatica e computadores', 'alameda');

INSERT INTO courses
    VALUES ('meic-t', 'MEIC-T', 'mestrado engenharia informatica e computadores', 'tagus');

INSERT INTO areas
    VALUES ('lit', 'LIT', 'Language and Information Technologies');

INSERT INTO areas
    VALUES ('g', 'G', 'Games');


INSERT INTO area_course
    VALUES ('lit', 'meic-a');

INSERT INTO area_course
    VALUES ('g', 'meic-t');


INSERT INTO theses
    VALUES (17992, 'Project: A Framework for ML Ops',
            '{"Luis Marques luis.marques@linkredglue.com (50%)", "Pedro Manuel Moreira Vaz Antunes de Sousa (50%)"}',
            1,
            'LinkRedGlue,  Avenida Duque Ávila 23 1000-138 Lisboa',
            '',
            'O ciclo de produção de SW, um conjunto de práticas conhecidas como DevOps permitiram enviar software para produção em  como o Tensorflow, Caffe, Torch, entre outras.',
            'not assigned',
            'Conhecimentos Python e Spark',
            'lit',
            'g');


INSERT INTO thesis_course
    VALUES (17992, 'meic-a');

INSERT INTO thesis_course
    VALUES (17992, 'meic-t');
