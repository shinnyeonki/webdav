#include "PaintPanel.h"
#include "PaintFrame.h"
#include "figure.h"
#include "FigureGroup.h"
#include "AbstractButton.h"

PaintPanel::PaintPanel() : Panel()
{
	frame = nullptr;
}

void PaintPanel::repaint(HDC dc)
{
	for (auto i : fg)
	{
		i->draw(frame->getHDC());
	}
}

void PaintPanel::setFigure()
{
	switch (shapeType)
	{
	case FIG_RECT:
	{
		Figure* Rect = new MRectangle(start_, end_);
		fg.push_back(Rect);
		break;
	}
	case FIG_ELL:
	{
		Figure* Ell = new MEllipse(start_, end_);
		fg.push_back(Ell);
		break;
	}
	case FIG_LINE:
	{
		Figure* Line = new MLine(start_, end_);
		fg.push_back(Line);
		break;
	}
	case FIG_GROUP:
	{
		Figure* FGroup = new FigureGroup();
		break;
	}
	default:
		break;
	}
}

void PaintPanel::actionPerformed(ActionEvent e)
{
	int type = (e.getSource()->getCommand());
	if (type < CHECK_GRID)
	{
		if (type == FIG_GROUP && e.isLButtonUpEvent())
		{
			setGrouped();
		}
		setShape(type);
	}
	else
	{
		setCheck(type);
	}
}

void PaintPanel::mousePressed(MEvent e)
{
	OutputDebugString(L"MousePressed\n");
	start_ = e.getPoint();
	moveFigure_ = findFigure(start_);
}

void PaintPanel::mouseReleased(MEvent e)
{
	OutputDebugString(L"MouseReleased\n");
	end_ = e.getPoint();

	if (e.isCtrlKeyDown())
	{
		if (moveFigure_)
		{
			moveFigure_->move(end_.x_ - start_.x_, end_.y_ - start_.y_);
		}
	}
	else if (isGroupKeyDown)
	{
		makeGroup();
	}
	else
	{
		if (isChecked)
		{
			setCheckBox();
		}
		setFigure();
	}
	this->repaint(frame->getHDC());
	frame->invalidate();
}

void PaintPanel::setCheckBox()
{
	start_ = CheckGrid(start_, 20);
	end_ = CheckGrid(end_, 20);
}


MPoint PaintPanel::CheckGrid(MPoint p, int size)
{
	return MPoint((p.x_ + 10) / size * size, (p.y_ + 10) / size * size);
}


Figure* PaintPanel::findFigure(MPoint p)
{
	list<Figure*>::reverse_iterator i;
	for (i = fg.rbegin(); i != fg.rend(); i++)
	{
		if ((*i)->find(p))
			return (*i);	//가장 위에 있는 도형을 찾는다.
	}
	return nullptr;
}

void PaintPanel::makeGroup()
{
	list<Figure*> index;

	for (auto i : fg)
	{
		if (isFigureExist(i, start_, end_))
		{
			index.push_back(i);
		}
	}
	if (!index.empty())
	{
		FigureGroup* fgGroup = new FigureGroup;
		for (auto i : index)
		{
			fgGroup->push(i);
			fg.remove(i);
		}
		fgGroup->setSize();
		fg.push_back(fgGroup);
	}
	setGrouped();
}

bool PaintPanel::isFigureExist(Figure* f, MPoint start, MPoint end)
{
	return start.x_ <= f->getStart().x_ && end.x_ >= f->getEnd().x_
		&& start.y_ <= f->getStart().y_ && end.y_ >= f->getEnd().y_;
}



void PaintPanel::setShape(int type)
{
	OutputDebugString(L"Click\n");
	shapeType = type;
}

void PaintPanel::setCheck(int type)
{
	checkBoxType = type;
	isChecked = !isChecked;
	OutputDebugString(L"Click\n");
}

void PaintPanel::setGrouped()
{
	isGroupKeyDown = !isGroupKeyDown;
}

void PaintPanel::setFrame(PaintFrame* f) 
{
	frame = f;
}