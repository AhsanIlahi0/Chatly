import { useState } from 'react';
import attachLightIcon from '../../images/attach-light.png'; // Adjust the path to your attach icon image
import attachDarkIcon from '../../images/attach-dark.png'; // Adjust the path to your attach icon image																																																
import sendLightIcon from '../../images/sendLight.png'; // Adjust the path to your send icon image
import sendDarkIcon from '../../images/sendDark.png'; // Adjust the path to your send icon image
function MessageInput({ theme, onSendMessage }) {
	const [messageText, setMessageText] = useState('');

	const handleSubmit = (event) => {
		event.preventDefault();

		if (!messageText.trim()) {
			return;
		}

		onSendMessage(messageText);
		setMessageText('');
	};
	const handleKeyDown = (event) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit(event);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
			<div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
				<label
					className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
					aria-label="Attach file"
				>
					<input
						type="file"
						className="hidden"
						onChange={(e) => console.log(e.target.files[0])}
					/>
					<img
						src={theme === 'light' ? attachLightIcon : attachDarkIcon}
						alt="Attach file"
						className="h-5 w-5"
					/>
				</label>
				<textarea
					id='txtarea'
					className="min-h-[29px] flex-1 resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
					placeholder="Type a message..."
					rows="1"
					value={messageText}
					onChange={(event) => setMessageText(event.target.value)}
					onKeyDown={handleKeyDown}
				/>
				<button
					className="cursor-pointer rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
					type="submit"
				>
					<img
						src={theme === 'light' ? sendLightIcon : sendDarkIcon}
						alt="Send message"
						className="h-5 w-5"
					/>
				</button>
			</div>
		</form>
	);
}

export default MessageInput;
