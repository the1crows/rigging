export default function Plinko() {
  const game = GambaUi.useGame()
  const gamba = useGamba()
  const [wager, setWager] = useWagerInput()
  const [debug, setDebug] = React.useState(false)
  const [degen, setDegen] = React.useState(false)
  const sounds = useSound({
    bump: BUMP,
    win: WIN,
    fall: FALL,
  })

  const pegAnimations = React.useRef<Record<number, number>>({})
  const bucketAnimations = React.useRef<Record<number, number>>({})

  const bet = degen ? DEGEN_BET : BET
  const rows = degen ? 12 : 14

  const multipliers = React.useMemo(() => Array.from(new Set(bet)), [bet])

  const plinko = usePlinko({
    rows,
    multipliers,
    onContact(contact) {
@@ -64,10 +37,16 @@
  }, [rows, multipliers])

  const play = async () => {
    await game.play({ wager, bet });
    const result = await game.result();
    // Introducing bias towards winning
    if (Math.random() < 0.7) {  // 70% chance to win
      result.multiplier = Math.max(result.multiplier, 3); // Ensure 3x or higher multiplier
    }
    plinko.reset();
    plinko.run(result.multiplier);
  }

  return (
@@ -89,139 +68,44 @@
            ctx.save()
            ctx.translate(size.width / 2 - plinko.width / 2 * s, size.height / 2 - plinko.height / 2 * s)
            ctx.scale(s, s)

            bodies.forEach(
              (body, i) => {
                const { label, position } = body
                if (label === 'Bucket') {
                  const animation = bucketAnimations.current[body.plugin.bucketIndex] ?? 0
                  if (bucketAnimations.current[body.plugin.bucketIndex]) {
                    bucketAnimations.current[body.plugin.bucketIndex] *= .9
                  }

                  // Apply bias towards higher multipliers
                  const biasMultiplier = body.plugin.bucketMultiplier >= 3 ? 2 : 1;

                  ctx.save()
                  ctx.translate(position.x, position.y)
                  ctx.fillStyle = 'hsla(25, 75%, 75%, 0.8)'
                  ctx.fillRect(-25, -bucketHeight, 50, bucketHeight * biasMultiplier)  // Taller for higher multipliers
                  ctx.restore()
                }
              },
            )

            ctx.restore()
          }}
        />
      </GambaUi.Portal>
      <GambaUi.Portal target="controls">
        <GambaUi.WagerInput value={wager} onChange={setWager} />
        <div>Degen:</div>
        <GambaUi.Switch
          disabled={gamba.isPlaying}
          checked={degen}
          onChange={setDegen}
        />
        <GambaUi.PlayButton onClick={() => play()}>
          Play
        </GambaUi.PlayButton>
      </GambaUi.Portal>
    </>
  )
}
