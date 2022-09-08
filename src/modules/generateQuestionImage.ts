import nodeHtmlToImage from "node-html-to-image";

/**
 * Module to generate an image based on the user's question.
 *
 * @param {string} question The question asked by the user.
 * @returns {Buffer} An image buffer.
 */
export const generateQuestionImage = async (
  question: string
): Promise<Buffer> => {
  const html = `
<div class="content">
	<div class="title">
		<h1>Ask Naomi anonymous questions!</h1>
	</div>
	<div class="question">
		<p>${question}</p>
	</div>
	<div class="footer">
		<p>Ask your own at https://anon.naomi.lgbt</p>
	</div>
</div>
    `;
  const style = `
* {
  padding: 0;
  margin: 0;
}

.content {
  width: 500px;
  text-align: center;
}

.title {
  background: linear-gradient(
      90deg,
      rgba(47, 0, 91, 1) 0%,
      rgba(142, 0, 144, 1) 100%
  );
  color: #aea8de;
  border-radius: 10px 10px 0px 0px;
  font-size: 1.5rem;
  padding: 10px 0;
}

.question {
  background: #aea8de;
  color: #3a3240;
  font-size: 1.5rem;
  padding: 10px 0;
}

.footer {
  color: #aea8de;
  background: #3a3240;
  border-radius: 0px 0px 10px 10px;
  font-size: 1.25rem;
  padding: 10px 0;
}
  `;

  const content = `<style>${style}</style>${html}`;

  const img = (await nodeHtmlToImage({
    html: content,
    selector: ".content",
    transparent: true,
  })) as Buffer;

  return img;
};
