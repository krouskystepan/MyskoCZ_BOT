const pb = {
  le: '<:le:1297940119168221194>',
  me: '<:me:1297940112927359130>',
  re: '<:re:1297940114563010610>',
  lf: '<:lf:1297940111522009111>',
  mf: '<:mf:1297940117801144451>',
  rf: '<:rf:1297940116203110432>',
}

export function formatResults(
  upvotes: string[] = [],
  downvotes: string[] = []
) {
  const totalVotes = upvotes.length + downvotes.length
  const progressBarLength = 14
  const filledSquares =
    Math.round((upvotes.length / totalVotes) * progressBarLength) || 0
  let emptySquares = progressBarLength - filledSquares || 0

  if (!filledSquares && !emptySquares) {
    emptySquares = progressBarLength
  }

  const upPercentage = (upvotes.length / totalVotes) * 100 || 0
  const downPercentage = (downvotes.length / totalVotes) * 100 || 0

  const progressBar =
    (filledSquares ? pb.lf : pb.le) +
    (pb.mf.repeat(filledSquares) + pb.me.repeat(emptySquares)) +
    (filledSquares === progressBarLength ? pb.rf : pb.re)

  const results: string[] = []
  results.push(
    `👍 ${upvotes.length} Ano (${upPercentage.toFixed(1)}%) • 👎 ${
      downvotes.length
    } Ne (${downPercentage.toFixed(1)}%)`
  )
  results.push(progressBar)

  return results.join('\n')
}
