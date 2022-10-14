import nodeHtmlToImage from "node-html-to-image";

import { ImageColours, ImageFooters, ImageTitles } from "../interfaces/Enums";
import { Category } from "../interfaces/Submission";

/**
 * Module to generate an image based on the user's question.
 *
 * @param {string} question The question asked by the user.
 * @param {Category} category The category of the question.
 * @returns {Buffer} An image buffer.
 */
export const generateQuestionImage = async (
  question: string,
  category: Category
): Promise<Buffer> => {
  const html = `
<div class="content">
	<div class="title">
		<h1>${ImageTitles[category]}</h1>
	</div>
	<div class="question">
		<p>${question}</p>
	</div>
	<div class="footer">
		<p>${ImageFooters[category]}</p>
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
      ${ImageColours[category].gradDark} 0%,
      ${ImageColours[category].gradLight} 100%
  );
  color: ${ImageColours[category].light};
  border-radius: 10px 10px 0px 0px;
  font-size: 1.5rem;
  padding: 10px 0;
}

.question {
  background: ${ImageColours[category].light};
  color: ${ImageColours[category].dark};
  font-size: 1.5rem;
  padding: 10px 0;
}

.footer {
  color: ${ImageColours[category].light};
  background: ${ImageColours[category].dark};
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
