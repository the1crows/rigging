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
      if (contact.peg && contact.plinko) {
        pegAnimations.current[contact.peg.plugin.pegIndex] = 1
        sounds.play('bump', { playbackRate: 1 + Math.random() * .05 })
      }
      if (contact.barrier && contact.plinko) {
        sounds.play('bump', { playbackRate: .5 + Math.random() * .05 })
      }
      if (contact.bucket && contact.plinko) {
        bucketAnimations.current[contact.bucket.plugin.bucketIndex] = 1
        sounds.play(contact.bucket.plugin.bucketMultiplier >= 1 ? 'win' : 'fall')
      }
    },
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
    <>
      <GambaUi.Portal target="screen">
        <GambaUi.Canvas
          render={({ ctx, size }, clock) => {
            if (!plinko) return

            const bodies = plinko.getBodies()

            const xx = size.width / plinko.width
            const yy = size.height / plinko.height
            const s = Math.min(xx, yy)

            ctx.clearRect(0, 0, size.width, size.height)
            ctx.fillStyle = '#0b0b13'
            ctx.fillRect(0, 0, size.width, size.height)
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
