import pandas as pd
import re
from sklearn.model_selection import train_test_split

# Load dataset
df = pd.read_csv(r"C:\Users\91756\OneDrive\Desktop\datasets\twitter\training.1600000.processed.noemoticon.csv", encoding='latin-1', header=None)
df.columns = ['target', 'ids', 'date', 'flag', 'user', 'text']
df = df[['target', 'text']]

# Keep only 0 and 4 classes
df = df[df['target'].isin([0, 4])]
df['target'] = df['target'].apply(lambda x: 0 if x == 0 else 1)

# Sample 7500 negative and 7500 positive
df_neg = df[df['target'] == 0].sample(7500, random_state=42)
df_pos = df[df['target'] == 1].sample(7500, random_state=42)
df_sample = pd.concat([df_neg, df_pos]).sample(frac=1, random_state=42).reset_index(drop=True)

# Clean the tweet text
def clean_text(text):
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"#\w+", "", text)
    text = re.sub(r"[^A-Za-z\s]", "", text)
    return text.lower().strip()

df_sample['clean_text'] = df_sample['text'].apply(clean_text)

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(df_sample['clean_text'], df_sample['target'], test_size=0.2, random_state=42)

# Save to CSV
pd.DataFrame({'text': X_train, 'label': y_train}).to_csv("train_data.csv", index=False)
pd.DataFrame({'text': X_test, 'label': y_test}).to_csv("test_data.csv", index=False)

print("✅ Saved train_data.csv and test_data.csv successfully.")
