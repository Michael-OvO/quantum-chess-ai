import qchess

from copy import deepcopy

def ai_play_game(ai = {'white': 'v0', 'black': 'v1'}):
    game = qchess.QChessGame()
    history = []
    last_moves = {'white': [], 'black': []}
    error = False

    while game.is_finish_or_not() == 'continue' and len(history) < 1000:

        if game.is_white:
            name = 'white'
        else:
            name = 'black'

        move = qchess.ai.get_greedy_move(game, ver=ai[name], last_moves=last_moves[name])
        # print(name+": "+move)
        last_moves[name].append(deepcopy(move))
        last_moves[name] = last_moves[name][-2:]
        assert len(last_moves[name]) <= 2
        try:
            game.run_short_cmd(move, True, True)
            lm = game.sim.last_measure
            if lm is None:
                lm = 'No measurement required'
            else:
                lm = str(lm)
                move += ','+lm
        except:
            error = True
            break
        print(name+": "+move)
        history.append(move)

    state = game.is_finish_or_not()
    if error:
        return history, 'error', 'NA'
    elif state == 'black':
        return history, 'black', ai['black']
    elif state == 'white':
        return history, 'white', ai['white']
    elif state == 'continue':
        return history, 'continue', 'NA'
    else:
        return history, 'draw', 'NA'

count = {'white': 0, 'black': 0, 'draw': 0, 'continue': 0,
         'total': 0, 'v1': 0, 'v0': 0, 'NA': 0, 'error': 0}

fname = './history_vsgame/summary.txt'

with open(fname, 'w') as f:
    f.write('')

for i in range(100):
    if i % 2 == 0:
        history, winner, ai = ai_play_game({'white': 'v1', 'black': 'v0'})
        text0 = "Idx: %d, White AI: %s, Black AI: %s" % (i+1, 'v1', 'v0')
    else:
        history, winner, ai = ai_play_game({'white': 'v0', 'black': 'v1'})
        text0 = "Idx: %d, White AI: %s, Black AI: %s" % (i+1, 'v0', 'v1')
    print(text0)
    count['total'] += 1
    count[winner] += 1
    count[ai] += 1
    text1 = "Idx: %d, Game Steps: %d, Winner: %s, AI: %s" % (i+1, len(history), winner, ai)
    print(text1)

    # save game history
    fname_case = './history_vsgame/case_%d.txt' % (i+1)

    with open(fname_case, 'w') as f:
        f.write('')

    with open(fname_case, 'a') as f:
        for move in history:
            f.write(move+'\n')

    with open(fname, 'a') as f:
        f.write(text0+'\n')
        f.write(text1+'\n')

    text = "Idx: %d, White: %d, Black: %d, Draw: %d, Continue: %d, v1: %d, v0: %d, NA: %d, Error: %d\n" % (count['total'], count['white'], count['black'], count['draw'], count['continue'], count['v1'], count['v0'], count['NA'], count['error'])
    print(text)
    with open(fname, 'a') as f:
        f.write(text+'\n')
